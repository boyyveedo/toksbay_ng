import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto, CreateAdminDto } from '../dto';
import { CreateSocialUserDto } from 'src/modules/auths/dto';

export interface IUserRepository {
    createAdminUser(dto: CreateAdminDto): Promise<User>;
    createUser(dto: CreateUserDto): Promise<User>;
    createSocialUser(dto: CreateSocialUserDto): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    findSocialUser(providerId: string, provider: string): Promise<User | null>;
    updateUser(id: string, data: UpdateUserDto): Promise<User>;
    deleteUser(id: string): Promise<User>;
    findAllUsers(limit: number, skip: number): Promise<User[]>;
    banUser(id: string): Promise<User>;
    unban(id:string): Promise<User>
    updateStatus(id: string) : Promise<User>
}
