import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { verificationCodeDto } from '../dto';
@Injectable()
export class VerificationHelper {
    private readonly logger = new Logger(VerificationHelper.name);

    generateVerificationCode(): string {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
    async createVerificationCode(
        prisma: PrismaService,
        userEmail: string,
    ): Promise<string> {
        try {
            const user = await prisma.user.findUnique({
                where: { email: userEmail },
            });

            if (!user) {
                this.logger.error(`User record with email ${userEmail} not found`);
                throw new ForbiddenException(`User record not found`);
            }

            await prisma.verification.deleteMany({
                where: { userId: user.id },
            });

            const verificationCode = this.generateVerificationCode();
            const hashCode = await argon2.hash(verificationCode);

            await prisma.verification.create({
                data: {
                    userId: user.id,
                    verificationCode: hashCode,
                    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
                },
            });

            return verificationCode;
        } catch (error) {
            this.logger.error(`Verification code creation failed: ${error.message}`, error.stack);
            throw error;
        }
    }

}
