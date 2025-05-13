import { User } from '@prisma/client';
import { SignUpDto } from 'src/modules/auth /dto';
import { UpdateUserDto } from '../dto';

export interface IUserService {
    createUser(data: SignUpDto): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    updateUser(id: string, data: UpdateUserDto): Promise<User>;
    deleteUser(id: string): Promise<User>;
}
