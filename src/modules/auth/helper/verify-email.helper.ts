import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { VerificationResponse } from '../types/verification-response.types';
import { verificationCodeDto } from '../dto';
import { User, UserStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class VerifyEmailHelper {
    private readonly logger = new Logger(VerifyEmailHelper.name);

    constructor(private readonly prisma: PrismaService) { }

    async verifyEmail(code: verificationCodeDto): Promise<VerificationResponse> {
        this.logger.log(`Attempting to verify email for user: ${code.userId}`);

        const verification = await this.prisma.verification.findFirst({
            where: { userId: code.userId, isVerified: false },
        });
        if (!verification) {
            this.logger.error('No unverified record found for this user or already verified');
            throw new ForbiddenException('Verification record not found or already verified.');
        }
        const currentTime = new Date();
        if (currentTime > verification.expiresAt) {
            this.logger.error('Verification code has expired');
            throw new ForbiddenException('Verification code has expired.');
        }
        let isVerificationCodeValid: boolean;
        try {
            isVerificationCodeValid = await argon2.verify(verification.verificationCode, code.verificationCode);
        } catch (error) {
            this.logger.error('Error verifying code:', error);
            throw new ForbiddenException('Invalid verification code.');
        }
        if (!isVerificationCodeValid) {
            this.logger.error('Invalid verification code');
            throw new ForbiddenException('Invalid verification code.');
        }
        this.logger.log('Verification successful, updating record...');
        await this.prisma.verification.update({
            where: { id: verification.id },
            data: { isVerified: true },
        });
        await this.prisma.user.update({
            where: { id: code.userId },
            data: {
                status: UserStatus.ACTIVE,
                isVerified: true,
            },
        });


        const updatedUser = await this.prisma.user.findUnique({
            where: { id: code.userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
            },
        });

        if (!updatedUser) {
            this.logger.error('User not found');
            throw new ForbiddenException('User not found.');
        }

        return {
            success: true,
            message: 'Email successfully verified!',
            user: updatedUser,
        };
    }
}