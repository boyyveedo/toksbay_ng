import {
    Injectable,
    Logger,
    BadRequestException,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SignUpDto, CreateSocialUserDto } from '../dto';
import { AuthResponseType } from '../types';
import { TokenService } from './token.service';
import { VerificationService } from './verification.service';
import { UserMapper } from 'src/modules/users /user.mapper';
import { IRegistrationService } from '../interface';
import { User } from '@prisma/client';
import { IUserRepository } from 'src/modules/users /repository/user.repository.interface';
import { UserService } from 'src/modules/users /services/users.services';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RegistrationService implements IRegistrationService {
    private readonly logger = new Logger(RegistrationService.name);

    constructor(
        private readonly prisma : PrismaService,
        private  readonly userMutationService: UserService,
        private readonly tokenService: TokenService,
        private  readonly verificationService: VerificationService,
        @Inject('IUserRepository') private userRepository: IUserRepository,
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
                user.role,
            );

            await this.verificationService.sendVerificationEmail(user);

            return {
                accessToken,
                refreshToken,
                user: UserMapper.toResponseDto(user),
            };
        } catch (error) {
            this.logger.error('Error during registration', error.stack);

            if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
                this.logger.warn(`Duplicate credentials: ${dto.email}`);
                throw new ForbiddenException('Credentials taken');
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
          user = await this.userRepository.findUserByEmail(userData.email);
          
          if (user) {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: {
                  providerId: userData.providerId,
                  provider: userData.provider,
                  isVerified: true ,
                  status: "ACTIVE"
                  
                }
              });
            this.logger.log(`Connected existing user ${user.email} to ${userData.provider}`);
          } else {
            const socialUserDto: CreateSocialUserDto = {
              email: userData.email,
              firstName: userData.firstName,
              lastName: userData.lastName,
              providerId: userData.providerId,
              provider: userData.provider,
              isEmailVerified: true, 
            };
            
            user = await this.userMutationService.createSocialUser(socialUserDto);
            if (user.status !== 'ACTIVE') {
                user = await this.prisma.user.update({
                  where: { id: user.id },
                  data: { 
                    status: 'ACTIVE',
                    isVerified: true
                  }
                });
              }
            this.logger.log(`Created new user from ${userData.provider} with ID: ${user.id}`);
            
           
          }
        }
        
        return user;
      }
}
