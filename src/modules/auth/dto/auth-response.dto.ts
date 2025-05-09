import { Role } from '@prisma/client';

export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: Role;
    };
}