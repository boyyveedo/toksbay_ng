import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "src/prisma/prisma.service";
import { EmailService } from "src/infrastructure/services/mail";
import { RequestPasswordResetDto, ResetPasswordDto } from "../dto";
import { RequestPasswordResetResponse, ResetPasswordResponse } from "../types";
import * as argon2 from "argon2";
import * as crypto from "crypto";

@Injectable()
export class AuthHelper {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
        private readonly emailService: EmailService,
    ) { }

    async requestPasswordReset(
        requestDto: RequestPasswordResetDto
    ): Promise<RequestPasswordResetResponse> {
        const user = await this.prisma.user.findUnique({
            where: { email: requestDto.email },
        });

        if (!user) {
            throw new ForbiddenException("Email not found");
        }

        const resetToken = crypto.randomBytes(32).toString("hex");

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

        const frontendUrl = this.configService.get("FRONTEND_URL") || "http://localhost:3000";
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
        
        try {
            await this.emailService.sendVerificationEmail({
                subject: "Password Reset Request",
                email: user.email,
                name: user.firstName,
                resetLink,
                template: "./forget-password",
            });

            return { message: "Password reset link has been sent to your email." };
        } catch (error) {
            console.error("Error sending email:", error);
            throw new Error("Error sending password reset email");
        }
    }

    async resetPassword(reset: ResetPasswordDto): Promise<ResetPasswordResponse> {
        const { resetToken, newPassword, confirmPassword } = reset;

        if (newPassword !== confirmPassword) {
            throw new ForbiddenException("Passwords do not match");
        }

        const passwordReset = await this.prisma.passwordReset.findUnique({
            where: { resetToken },
        });

        if (!passwordReset || new Date() > passwordReset.expiresAt) {
            throw new ForbiddenException("Invalid or expired reset token");
        }

        const user = await this.prisma.user.findUnique({
            where: { id: passwordReset.userId },
        });

        if (!user) {
            throw new ForbiddenException("User not found");
        }

        const hashedPassword = await argon2.hash(newPassword);

        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });

        await this.prisma.passwordReset.delete({
            where: { resetToken },
        });

        return {
            message: "Your password has been successfully reset",

        };
    }
}
