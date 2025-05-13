import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { VerificationHelper } from '../helper';
import { EmailService } from 'src/infrastructure/services/mail';
import { VerifyEmailHelper, sendVerificationEmail } from '../helper';
import { User, UserStatus } from '@prisma/client';
import { VerificationResponse } from '../types';
import { verificationCodeDto } from '../dto';

@Injectable()
export class VerificationService {
    private readonly logger = new Logger(VerificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly verificationHelper: VerificationHelper,
        private readonly emailService: EmailService,
        private readonly verify: VerifyEmailHelper,
    ) { }

    async sendVerificationEmail(user: User): Promise<void> {
        this.logger.log(`Generating verification code for user: ${user.email}`);

        const code = await this.verificationHelper.createVerificationCode(
            this.prisma,
            user.email,
        );

        await sendVerificationEmail(this.emailService, user, code);

        this.logger.log(`Verification email sent to ${user.email}`);
    }

    async verifyEmail(codeDto: verificationCodeDto): Promise<VerificationResponse> {
        return this.verify.verifyEmail(codeDto);
    }

    async resendVerificationEmail(email: string): Promise<{ message: string }> {
        this.logger.log(`Resending verification email to: ${email}`);

        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user) {
            this.logger.warn(`No user found with email: ${email}`);
            throw new Error('User not found');
        }

        if (user.status === UserStatus.ACTIVE) {
            this.logger.warn(`User with email ${email} is already verified`);
            throw new Error('Email already verified');
        }

        const newCode = await this.verificationHelper.createVerificationCode(
            this.prisma,
            email,
        );

        await sendVerificationEmail(this.emailService, user, newCode);
        return { message: 'Verification email resent successfully' };

        this.logger.log(`New verification email sent to ${email}`);
    }



}