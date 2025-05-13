import {
    ForbiddenException,
    Injectable,
    NotFoundException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/infrastructure/services/mail';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto';
import { RequestPasswordResetResponse, ResetPasswordResponse } from '../types';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class PasswordResetService {
    private readonly logger = new Logger(PasswordResetService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    async requestPasswordReset(
        requestDto: RequestPasswordResetDto,
    ): Promise<RequestPasswordResetResponse> {
        const user = await this.prisma.user.findUnique({
            where: { email: requestDto.email },
            select: { id: true, firstName: true, email: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        this.logger.log(
            `🔐 Generated reset token for ${user.email}: ${resetToken}`,
        );

        await this.prisma.passwordReset.deleteMany({
            where: {
                userId: user.id,
                expiresAt: { gt: new Date() },
            },
        });

        await this.prisma.passwordReset.create({
            data: {
                userId: user.id,
                resetToken,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        const resetLink = `${this.configService.get(
            'FRONTEND_URL',
        )}/reset-password?token=${resetToken}`;

        try {
            await this.emailService.sendVerificationEmail({
                subject: 'Password Reset Request',
                email: user.email,
                name: user.firstName,
                resetLink,
                template: './forget-password',
            });

            this.logger.log(` Reset link sent: ${resetLink}`);

            return {
                message: 'Password reset link has been sent to your email.',
            };
        } catch (error) {
            this.logger.error(' Error sending reset email', error);
            throw new Error('Failed to send password reset email');
        }
    }

    async resetPassword(
        reset: ResetPasswordDto,
    ): Promise<ResetPasswordResponse> {
        const { resetToken, newPassword, confirmPassword } = reset;

        if (newPassword !== confirmPassword) {
            this.logger.warn(' Passwords do not match');
            throw new ForbiddenException('Passwords do not match');
        }

        const passwordReset = await this.prisma.passwordReset.findFirst({
            where: { resetToken },
        });

        if (
            !passwordReset ||
            new Date() > passwordReset.expiresAt
        ) {
            this.logger.warn(' Invalid or expired reset token');
            throw new ForbiddenException(
                'Invalid or expired reset token',
            );
        }

        const user = await this.prisma.user.findUnique({
            where: { id: passwordReset.userId },
            select: { password: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        this.logger.log(
            'Current password hash before update:',
            user.password,
        );

        const hashedPassword = await argon2.hash(newPassword);

        await this.prisma.user.update({
            where: { id: passwordReset.userId },
            data: { password: hashedPassword },
        });

        this.logger.log(' Password successfully updated');

        await this.prisma.passwordReset.delete({
            where: { resetToken },
        });

        return {
            message: 'Your password has been successfully reset',
        };
    }
}
