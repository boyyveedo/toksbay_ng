import { Injectable, Logger, Inject } from '@nestjs/common';
import { User } from '@prisma/client';
import { IUserRepository } from '../repository/user.repository.interface';
@Injectable()
export class UserQueryService {
    private readonly logger = new Logger(UserQueryService.name);

    constructor(@Inject('IUserRepository') private userRepository: IUserRepository
    ) { }

    async findUserByEmail(email: string): Promise<User | null> {
        this.logger.log(`Finding user by email: ${email}`);
        return this.userRepository.findUserByEmail(email);
    }

    async findUserById(id: string): Promise<User | null> {
        this.logger.log(`Finding user by ID: ${id}`);
        return this.userRepository.findUserById(id);
    }

    async findAllUsers(limit: number, skip: number): Promise<User[]> {
        this.logger.log(`Finding users with limit: ${limit}, skip: ${skip}`);
        return this.userRepository.findAllUsers(limit, skip);
    }
}