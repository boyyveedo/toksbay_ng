import {
    Injectable,
    HttpException,
    HttpStatus,
    Logger,
    Inject,
    forwardRef,
  } from '@nestjs/common';
  import { UserRepository } from '../repository/user.repository';
import { PasswordService } from 'src/modules/auths/services';
  import { CreateUserDto, UpdateUserDto, CreateAdminDto } from '../dto';
  import { CreateSocialUserDto } from 'src/modules/auths/dto';
  import { SignUpDto } from 'src/modules/auths/dto';
  import { Role, User } from '@prisma/client';
  
  @Injectable()
  export class UsersService {
    private readonly logger = new Logger(UsersService.name);
  
    constructor(
      private userRepository: UserRepository,
      @Inject(forwardRef(() => PasswordService)) private passwordService: PasswordService,
    ) {}
  
    // Query methods
    async findUserByEmail(email: string): Promise<User | null> {
      this.logger.debug(`Finding user by email: ${email}`);
      try {
        const user = await this.userRepository.findUserByEmail(email);
        this.logger.debug(`User ${user ? 'found' : 'not found'} for email: ${email}`);
        return user;
      } catch (error) {
        this.logger.error(`Failed to find user by email: ${email}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to find user by email', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async findUserById(id: string): Promise<User | null> {
      this.logger.debug(`Finding user by id: ${id}`);
      try {
        const user = await this.userRepository.findUserById(id);
        this.logger.debug(`User ${user ? 'found' : 'not found'} for id: ${id}`);
        return user;
      } catch (error) {
        this.logger.error(`Failed to find user by id: ${id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to find user by id', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async findAllUsers(limit: number, skip: number): Promise<User[]> {
      this.logger.debug(`Fetching all users with limit: ${limit}, skip: ${skip}`);
      try {
        const users = await this.userRepository.findAllUsers(limit, skip);
        this.logger.debug(`Retrieved ${users.length} users`);
        return users;
      } catch (error) {
        this.logger.error(`Failed to fetch users with limit: ${limit}, skip: ${skip}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to fetch users', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    // Mutation methods
    async createUser(dto: SignUpDto): Promise<User> {
      this.logger.debug(`Creating user with email: ${dto.email}`);
      try {
        if (!dto.password) {
          this.logger.warn(`Password missing for manual signup with email: ${dto.email}`);
          throw new HttpException('Password is required for manual signup', HttpStatus.BAD_REQUEST);
        }
  
        const hashedPassword = await this.passwordService.hashPassword(dto.password);
        const createUserDto: CreateUserDto = {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.CUSTOMER,
        };
  
        const user = await this.userRepository.createUser(createUserDto);
        this.logger.debug(`User created successfully: ${user.id}`);
        return user;
      } catch (error) {
        this.logger.error(`Failed to create user with email: ${dto.email}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async createSocialUser(dto: CreateSocialUserDto): Promise<User> {
      this.logger.debug(`Creating social user with email: ${dto.email}`);
      try {
        const user = await this.userRepository.createSocialUser(dto);
        this.logger.debug(`Social user created successfully: ${user.id}`);
        return user;
      } catch (error) {
        this.logger.error(`Failed to create social user with email: ${dto.email}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to create social user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async updateUser(id: string, data: UpdateUserDto, currentUser: User): Promise<Omit<User, 'password'>> {
      this.logger.debug(`Updating user with id: ${id} by user: ${currentUser.id}`);
      try {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
          this.logger.warn(`User not found with id: ${id}`);
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
  
        const isSelfUpdate = currentUser.id === id;
        const isAdmin = currentUser.role === Role.ADMIN;
  
        if (!isSelfUpdate && !isAdmin) {
          this.logger.warn(`Unauthorized update attempt by user: ${currentUser.id} on user: ${id}`);
          throw new HttpException('You are not authorized to update this user', HttpStatus.FORBIDDEN);
        }
  
        if (data.role) {
          if ((isSelfUpdate && data.role === Role.ADMIN) || (!isAdmin && data.role === Role.ADMIN)) {
            this.logger.warn(`Unauthorized attempt to assign ADMIN role by user: ${currentUser.id}`);
            throw new HttpException('You are not authorized to assign ADMIN role', HttpStatus.FORBIDDEN);
          }
        }
  
        if (!isAdmin) {
          delete data.role;
          delete data.status;
          delete data.isVerified;
        }
  
        const updatedUser = await this.userRepository.updateUser(id, data);
        this.logger.debug(`User updated successfully: ${id}`);
        return updatedUser;
      } catch (error) {
        this.logger.error(`Failed to update user with id: ${id} by user: ${currentUser.id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async deleteUser(id: string): Promise<User> {
      this.logger.debug(`Deleting user with id: ${id}`);
      try {
        const userExists = await this.userRepository.findUserById(id);
        if (!userExists) {
          this.logger.warn(`User not found with id: ${id}`);
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
  
        const deletedUser = await this.userRepository.deleteUser(id);
        this.logger.debug(`User deleted successfully: ${id}`);
        return deletedUser;
      } catch (error) {
        this.logger.error(`Failed to delete user with id: ${id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async banUser(id: string): Promise<User> {
      this.logger.debug(`Banning user with id: ${id}`);
      try {
        const userExists = await this.userRepository.findUserById(id);
        if (!userExists) {
          this.logger.warn(`User not found with id: ${id}`);
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
  
        const bannedUser = await this.userRepository.banUser(id);
        this.logger.debug(`User banned successfully: ${id}`);
        return bannedUser;
      } catch (error) {
        this.logger.error(`Failed to ban user with id: ${id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to ban user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async unbanUser(id: string): Promise<User> {
      this.logger.debug(`Unbanning user with id: ${id}`);
      try {
        const user = await this.userRepository.findUserById(id);
        if (!user) {
          this.logger.warn(`User not found with id: ${id}`);
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
  
        const unbannedUser = await this.userRepository.updateStatus(id, 'ACTIVE');
        this.logger.debug(`User unbanned successfully: ${id}`);
        return unbannedUser;
      } catch (error) {
        this.logger.error(`Failed to unban user with id: ${id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to unban user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async createAdminUser(dto: CreateAdminDto): Promise<User> {
      this.logger.debug(`Creating admin user with email: ${dto.email}`);
      try {
        if (dto.secretKey !== process.env.ADMIN_SECRET_KEY) {
          this.logger.warn(`Invalid admin secret key for email: ${dto.email}`);
          throw new HttpException('Invalid admin secret key', HttpStatus.BAD_REQUEST);
        }
    
        const existingUser = await this.userRepository.findUserByEmail(dto.email);
        if (existingUser) {
          this.logger.warn(`User with email already exists: ${dto.email}`);
          throw new HttpException('User with this email already exists', HttpStatus.BAD_REQUEST);
        }
    
        const hashedPassword = await this.passwordService.hashPassword(dto.password);
        const hashedSecretKey = await this.passwordService.hashPassword(dto.secretKey);
    
        const createAdminDto = {
          email: dto.email,
          password: hashedPassword,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: Role.ADMIN,
          status: 'ACTIVE',
          isVerified: true,
          secretKey: hashedSecretKey,
        };
    
        const user = await this.userRepository.createAdminUser(createAdminDto);
        this.logger.debug(`Admin user created successfully: ${user.id}`);
    
        // Sanitize the response
        const { password, secretKey, ...safeUser } = user;
        return safeUser as User;
      } catch (error) {
        this.logger.error(`Failed to create admin user with email: ${dto.email}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to create admin user', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
    
  
    async promoteToModerator(userId: string, admin: User) {
      this.logger.debug(`Promoting user to moderator with id: ${userId} by admin: ${admin.id}`);
      try {
        if (admin.role !== Role.ADMIN) {
          this.logger.warn(`Unauthorized promotion attempt by user: ${admin.id}`);
          throw new HttpException('Only admins can promote users to moderator', HttpStatus.FORBIDDEN);
        }
  
        const user = await this.userRepository.findUserById(userId);
        if (!user) {
          this.logger.warn(`User not found with id: ${userId}`);
          throw new HttpException(`User with ID ${userId} not found`, HttpStatus.NOT_FOUND);
        }
  
        if (user.role === Role.MODERATOR) {
          this.logger.warn(`User already a moderator: ${userId}`);
          throw new HttpException('User is already a moderator', HttpStatus.BAD_REQUEST);
        }
  
        if (user.role === Role.ADMIN) {
          this.logger.warn(`Cannot change admin role for user: ${userId}`);
          throw new HttpException('Cannot change admin role', HttpStatus.BAD_REQUEST);
        }
  
        const updateData: UpdateUserDto = { role: Role.MODERATOR };
        const promotedUser = await this.userRepository.updateUser(userId, updateData);
        this.logger.debug(`User promoted to moderator successfully: ${userId}`);
  
        return {
          message: `User ${user.firstName} ${user.lastName} has been promoted to moderator`,
          user: {
            id: promotedUser.id,
            email: promotedUser.email,
            firstName: promotedUser.firstName,
            lastName: promotedUser.lastName,
            role: promotedUser.role,
            status: promotedUser.status,
            updatedAt: promotedUser.updatedAt,
          },
        };
      } catch (error) {
        this.logger.error(`Failed to promote user to moderator with id: ${userId} by admin: ${admin.id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to promote user to moderator', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }