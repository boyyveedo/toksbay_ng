import { User } from '@prisma/client';
import { UserResponseDto } from './types';
export class UserMapper {
    static toResponseDto(user: User): UserResponseDto {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}