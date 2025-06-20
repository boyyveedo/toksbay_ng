import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from 'src/modules/auth /services';
import { CreateUserDto, UpdateUserDto, CreateAdminDto } from '../dto';
import { CreateSocialUserDto } from 'src/modules/auth /dto';
import { SignUpDto } from 'src/modules/auth /dto';
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

    async unbanUser(id: string): Promise<User> {
        const user = await this.userRepository.findUserById(id);
        if (!user) throw new NotFoundException('User not found');
    
        return this.userRepository.updateStatus(id, 'ACTIVE');
      }
    


    async createAdminUser(dto: CreateAdminDto): Promise<User> {
        this.logger.log(`Creating admin user with email: ${dto.email}`);

        if (dto.secretKey !== process.env.ADMIN_SECRET_KEY) {
            throw new BadRequestException('Invalid admin secret key');
        }

        const existingUser = await this.userRepository.findUserByEmail(dto.email);
        if (existingUser) {
            throw new BadRequestException('User with this email already exists');
        }

        const hashedPassword = await this.passwordService.hashPassword(dto.password);

        const createAdminDto = {
            email: dto.email,
            password: hashedPassword,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: Role.ADMIN,
            status: 'ACTIVE',  
            isVerified: true, 
            secretKey: dto.secretKey, 

        };

        return this.userRepository.createAdminUser(createAdminDto);
    }



    async promoteToModerator(userId: string, admin: User) {
        if (admin.role !== Role.ADMIN) {
          throw new ForbiddenException('Only admins can promote users to moderator');
        }
            const user = await this.userRepository.findUserById(userId);
        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }
    
        if (user.role === Role.MODERATOR) {
          throw new BadRequestException('User is already a moderator');
        }
    
        if (user.role === Role.ADMIN) {
          throw new BadRequestException('Cannot change admin role');
        }
    
        const updateData: UpdateUserDto = { role: Role.MODERATOR };
        const promotedUser = await this.userRepository.updateUser(userId, updateData);    
        return {
          message: `User ${user.firstName} ${user.lastName} has been promoted to moderator`,
          user: {
            id: promotedUser.id,
            email: promotedUser.email,
            firstName: promotedUser.firstName,
            lastName: promotedUser.lastName,
            role: promotedUser.role,
            status: promotedUser.status,
            updatedAt: promotedUser.updatedAt
          }
        };
      }
}