import { UserStatus } from '@prisma/client';

export interface VerificationResponse {
    success: boolean;
    message: string;
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        status: UserStatus;
        createdAt: Date;
        updatedAt: Date;
        profile: {
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            bio: string | null;
            avatar: string | null;

        } | null;
    };
}
