import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SessionService {
    constructor(private prisma: PrismaService) { }

    async createSession(userId: string, token: string, expiresAt: Date) {
        return this.prisma.session.create({
            data: {
                userId,
                token,
                expiresAt,
            },
        });
    }

    async findByToken(token: string) {
        return this.prisma.session.findUnique({
            where: { token },
        });
    }

    async deleteSessionByToken(token: string) {
        return this.prisma.session.delete({
            where: { token },
        });
    }
}
