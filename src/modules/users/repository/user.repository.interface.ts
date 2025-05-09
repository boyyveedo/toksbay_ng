import { User } from '@prisma/client';

import { CreateSocialUserDto } from 'src/modules/auth/dto';
import { CreateUserDto, UpdateUserDto } from '../dto';
export interface IUserRepository {
    createUser(dto: CreateUserDto): Promise<User>;
    createSocialUser(dto: CreateSocialUserDto): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    findSocialUser(providerId: string, provider: string): Promise<User | null>;
    updateUser(id: string, data: UpdateUserDto): Promise<User>;
    deleteUser(id: string): Promise<User>;
    findAllUsers(limit: number, skip: number): Promise<User[]>;
}
