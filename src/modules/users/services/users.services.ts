import { Injectable, NotFoundException, Logger, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from '../../auth/services';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { CreateSocialUserDto } from '../../auth/dto';
import { VerificationService } from '../../auth/services';
import { Role } from '@prisma/client';
import { User } from '@prisma/client';
import { SignUpDto } from '../../auth/dto';
@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        private userRepository: UserRepository,
        @Inject(forwardRef(() => PasswordService)) private passwordService: PasswordService,
    ) { }

    async createUser(dto: SignUpDto): Promise<User> {
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
        return this.userRepository.createSocialUser(dto);
    }

    async findUserByEmail(email: string): Promise<User | null> {
        return this.userRepository.findUserByEmail(email);
    }

    async findUserById(id: string): Promise<User | null> {
        return this.userRepository.findUserById(id);
    }

    async updateUser(
        id: string,
        data: UpdateUserDto,
        currentUser: User
    ): Promise<Omit<User, 'password'>> {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new NotFoundException('User not found');

        const isSelfUpdate = currentUser.id === id;
        const isAdmin = currentUser.role === Role.ADMIN;

        if (!isSelfUpdate && !isAdmin) {
            throw new ForbiddenException('You are not authorized to update this user');
        }

        if (!isAdmin) {
            delete data.role;
            delete data.status;
            delete data.isVerified;
        }

        const updatedUser = await this.userRepository.updateUser(id, data);

        return updatedUser;
    }

    async deleteUser(id: string): Promise<User> {
        const userExists = await this.userRepository.findUserById(id);
        if (!userExists) throw new NotFoundException('User not found');
        return this.userRepository.deleteUser(id);
    }

    async findAllUsers(limit: number, skip: number): Promise<User[]> {
        return this.userRepository.findAllUsers(limit, skip);
    }
}