import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, CreateAdminDto } from '../dto';
import { CreateSocialUserDto } from 'src/modules/auths/dto';
import { UserStatus, User, Role } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UserRepository {
  private readonly logger = new Logger(UserRepository.name);

  constructor(private prisma: PrismaService) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    this.logger.debug(`Creating user with data: ${JSON.stringify(dto)}`);
    try {
      const user = await this.prisma.user.create({
        data: dto,
      });
      this.logger.debug(`User created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user with email: ${dto.email}`, error.stack);
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(`Email ${dto.email} already exists`, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createSocialUser(dto: CreateSocialUserDto): Promise<User> {
    this.logger.debug(`Creating social user with email: ${dto.email}, provider: ${dto.provider}`);
    try {
      const existingUser = await this.findUserByEmail(dto.email);
      if (existingUser) {
        this.logger.debug(`Existing user found with email: ${dto.email}`);
        return existingUser;
      }

      const socialUser = await this.findSocialUser(dto.providerId, dto.provider);
      if (socialUser) {
        this.logger.debug(`Existing social user found with providerId: ${dto.providerId}`);
        return socialUser;
      }

      const data: any = {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        providerId: dto.providerId,
        provider: dto.provider,
        isVerified: dto.isEmailVerified,
      };

      const user = await this.prisma.user.create({
        data,
      });
      this.logger.debug(`Social user created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create social user with email: ${dto.email}`, error.stack);
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(`Email ${dto.email} already exists`, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create social user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`);
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email,
          deletedAt: null,
        },
      });
      this.logger.debug(`User ${user ? 'found' : 'not found'} for email: ${email}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by email: ${email}`, error.stack);
      throw new HttpException('Failed to find user by email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findUserById(id: string): Promise<User | null> {
    this.logger.debug(`Finding user by id: ${id}`);
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          deletedAt: null,
        },
      });
      this.logger.debug(`User ${user ? 'found' : 'not found'} for id: ${id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by id: ${id}`, error.stack);
      throw new HttpException('Failed to find user by id', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<Omit<User, 'password'>> {
    this.logger.debug(`Updating user with id: ${id}, data: ${JSON.stringify(data)}`);
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!userExists) {
        this.logger.warn(`User not found with id: ${id}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { ...data },
      });

      const { password, ...userWithoutPassword } = updatedUser;
      this.logger.debug(`User updated successfully: ${id}`);
      return userWithoutPassword;
    } catch (error) {
      this.logger.error(`Failed to update user with id: ${id}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteUser(id: string): Promise<User> {
    this.logger.debug(`Deleting user with id: ${id}`);
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!userExists) {
        this.logger.warn(`User not found with id: ${id}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const deletedUser = await this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      this.logger.debug(`User deleted successfully: ${id}`);
      return deletedUser;
    } catch (error) {
      this.logger.error(`Failed to delete user with id: ${id}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllUsers(limit: number, skip: number): Promise<User[]> {
    this.logger.debug(`Fetching all users with limit: ${limit}, skip: ${skip}`);
    try {
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
        take: limit,
        skip: skip,
      });
      this.logger.debug(`Retrieved ${users.length} users`);
      return users;
    } catch (error) {
      this.logger.error(`Failed to fetch users with limit: ${limit}, skip: ${skip}`, error.stack);
      throw new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findSocialUser(providerId: string, provider: string): Promise<User | null> {
    this.logger.debug(`Finding social user with providerId: ${providerId}, provider: ${provider}`);
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          providerId_provider: {
            providerId,
            provider,
          },
        },
      });
      this.logger.debug(`Social user ${user ? 'found' : 'not found'} for providerId: ${providerId}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to find social user with providerId: ${providerId}, provider: ${provider}`, error.stack);
      throw new HttpException('Failed to find social user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async banUser(id: string): Promise<User> {
    this.logger.debug(`Banning user with id: ${id}`);
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!userExists) {
        this.logger.warn(`User not found with id: ${id}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const bannedUser = await this.prisma.user.update({
        where: { id },
        data: { status: UserStatus.BANNED },
      });
      this.logger.debug(`User banned successfully: ${id}`);
      return bannedUser;
    } catch (error) {
      this.logger.error(`Failed to ban user with id: ${id}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to ban user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    this.logger.debug(`Updating user status with id: ${id}, status: ${status}`);
    try {
      const userExists = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!userExists) {
        this.logger.warn(`User not found with id: ${id}`);
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: { status },
      });
      this.logger.debug(`User status updated successfully: ${id}, status: ${status}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user status with id: ${id}`, error.stack);
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Failed to update user status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createAdminUser(dto: CreateAdminDto): Promise<User> {
    this.logger.debug(`Creating admin user with email: ${dto.email}`);
    try {
      const data = {
        ...dto,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        isVerified: true,
      };
      const user = await this.prisma.user.create({ data });
      this.logger.debug(`Admin user created successfully: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create admin user with email: ${dto.email}`, error.stack);
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new HttpException(`Email ${dto.email} already exists`, HttpStatus.CONFLICT);
      }
      throw new HttpException('Failed to create admin user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}