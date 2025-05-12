import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from '../../auth/services';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { CreateSocialUserDto } from '../../auth/dto';
import { SignUpDto } from '../../auth/dto';
import { Role } from '@prisma/client';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private userRepository: UserRepository,
        @Inject(forwardRef(() => PasswordService)) private passwordService: PasswordService,
    ) { }

    // Query methods
    async findUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findUserByEmail(email);
    }

    async findUserById(id: string): Promise<User | null> {
        return this.userRepository.findUserById(id);
    }

    async findAllUsers(limit: number, skip: number): Promise<User[]> {
        return this.userRepository.findAllUsers(limit, skip);
    }

    // Mutation methods
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
            role: Role.CUSTOMER,
        };

        return this.userRepository.createUser(createUserDto);
    }

    async createSocialUser(dto: CreateSocialUserDto): Promise<User> {
        this.logger.log(`Creating social user with email: ${dto.email}`);
        return this.userRepository.createSocialUser(dto);
    }

    async updateUser(id: string, data: UpdateUserDto, currentUser: User): Promise<Omit<User, 'password'>> {
        this.logger.log(`Updating user with ID: ${id}`);

        const user = await this.userRepository.findUserById(id);
        if (!user) throw new NotFoundException('User not found');

        const isSelfUpdate = currentUser.id === id;
        const isAdmin = currentUser.role === Role.ADMIN;

        if (!isSelfUpdate && !isAdmin) {
            throw new ForbiddenException('You are not authorized to update this user');
        }

        if (data.role) {
            if ((isSelfUpdate && data.role === Role.ADMIN) || (!isAdmin && data.role === Role.ADMIN)) {
                throw new ForbiddenException('You are not authorized to assign ADMIN role');
            }
        }

        if (!isAdmin) {
            delete data.role;
            delete data.status;
            delete data.isVerified;
        }

        return this.userRepository.updateUser(id, data);
    }

    async deleteUser(id: string): Promise<User> {
        this.logger.log(`Deleting user with ID: ${id}`);

        const userExists = await this.userRepository.findUserById(id);
        if (!userExists) throw new NotFoundException('User not found');
        return this.userRepository.deleteUser(id);
    }

    async banUser(id: string): Promise<User> {
        this.logger.log(`Deleting user with ID: ${id}`);
        const userExists = await this.userRepository.findUserById(id);

        if (!userExists) throw new NotFoundException('User not found');

        return this.userRepository.banUser(id);
    }
}
