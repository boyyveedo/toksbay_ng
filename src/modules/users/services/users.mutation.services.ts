import { Injectable, Logger, BadRequestException, NotFoundException, Inject } from '@nestjs/common';
import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { CreateSocialUserDto } from 'src/modules/auth/dto';
import { IUserRepository } from '../repository/user.repository.interface';
import { PasswordService } from 'src/auth/password.service';
import { UserQueryService } from './users-query.services';
import { SignUpDto } from 'src/modules/auth/dto';

@Injectable()
export class UserMutationService {
    private readonly logger = new Logger(UserMutationService.name);

    constructor(
        @Inject('IUserRepository') private userRepository: IUserRepository,
        private passwordService: PasswordService,
        private userQueryService: UserQueryService,
    ) { }

    async createUser(dto: SignUpDto): Promise<User> {
        this.logger.log(`Creating user with email: ${dto.email}`);

        if (!dto.password) {
            throw new BadRequestException('Password is required for manual signup');
        }

        const hashedPassword = await this.passwordService.hashPassword(dto.password);
        const createUserDto: CreateUserDto = {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: dto.role,
        };

        return this.userRepository.createUser(createUserDto);
    }

    async createSocialUser(dto: CreateSocialUserDto): Promise<User> {
        this.logger.log(`Creating social user with email: ${dto.email}`);
        return this.userRepository.createSocialUser(dto);
    }

    async updateUser(id: string, data: UpdateUserDto): Promise<User> {
        this.logger.log(`Updating user with ID: ${id}`);

        const userExists = await this.userQueryService.findUserById(id);
        if (!userExists) {
            throw new NotFoundException('User not found');
        }

        return this.userRepository.updateUser(id, data);
    }

    async deleteUser(id: string): Promise<User> {
        this.logger.log(`Deleting user with ID: ${id}`);

        const userExists = await this.userQueryService.findUserById(id);
        if (!userExists) {
            throw new NotFoundException('User not found');
        }

        return this.userRepository.deleteUser(id);
    }
}
