import { Injectable, Logger, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SignUpDto } from '../dto';
import { AuthResponseType } from '../types';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';
import { UserMapper } from 'src/modules/users/user.mapper';
import { IRegistrationService } from '../interface';
import { User } from '@prisma/client';
import { CreateSocialUserDto } from '../dto';
import { IUserRepository } from 'src/modules/users/repository/user.repository.interface';
// import { UserQueryService } from 'src/modules/users/services/users-query.services';
import { UserService } from 'src/modules/users/services/users.services';
@Injectable()
export class RegistrationService implements IRegistrationService {
    private readonly logger = new Logger(RegistrationService.name);

    constructor(
        private userMutationService: UserService,
        private tokenService: TokenService,
        private verificationService: VerificationService,
        @Inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async signUp(dto: SignUpDto): Promise<AuthResponseType> {
        this.logger.log(`Attempting to register user with email: ${dto.email}`);
        try {
            const existingUser = await this.userMutationService.findUserByEmail(dto.email);
            if (existingUser) {
                this.logger.warn(`Email already in use: ${dto.email}`);
                throw new BadRequestException('Email already in use');
            }

            const user = await this.userMutationService.createUser(dto);
            this.logger.log(`User created with ID: ${user.id}`);

            const { accessToken, refreshToken } = await this.tokenService.generateTokens(
                user.id,
                user.email,
                user.isVerified,
                user.role
            );

            await this.verificationService.sendVerificationEmail(user);

            return {
                accessToken,
                refreshToken,
                user: UserMapper.toResponseDto(user),
            };
        } catch (error) {
            this.logger.error('Error during registration', error.stack);
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    this.logger.warn(`Registration failed due to duplicate credentials: ${dto.email}`);
                    throw new ForbiddenException('Credentials taken');
                }
            }
            throw error;
        }
    }

    async findOrCreateSocialUser(userData: {
        email: string;
        firstName: string;
        lastName: string;
        providerId: string;
        provider: string;
    }): Promise<User> {
        this.logger.log(`Looking up social user with ${userData.provider} ID: ${userData.providerId}`);

        let user = await this.userRepository.findSocialUser(userData.providerId, userData.provider);

        if (!user) {
            const socialUserDto: CreateSocialUserDto = {
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                providerId: userData.providerId,
                provider: userData.provider,
                isEmailVerified: false,
            };

            user = await this.userMutationService.createSocialUser(socialUserDto);
            this.logger.log(`Created new user from ${userData.provider} with ID: ${user.id}`);

            if (!user.isVerified) {
                await this.verificationService.sendVerificationEmail(user);
                this.logger.log(`Verification email sent to user ${user.email}`);
            }
        }

        return user;
    }
}
