import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { Request } from 'express';

// Custom cookie extractor function
const cookieExtractor = (req: Request): string | null => {
    if (req && req.cookies) {
        return req.cookies['accessToken'];
    }
    return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        configService: ConfigService,
        private prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                cookieExtractor,
                ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
        });
    }

    async validate(payload: { sub: string; email: string; isVerified: boolean; role: string; iat: number; exp: number }) {
        const now = Math.floor(Date.now() / 1000);
        const timeToExpiry = payload.exp - now;
        
        if (timeToExpiry < 0) {
            throw new UnauthorizedException('Token has expired');
        }

        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isVerified: true,
                status: true, // Important: check if user is banned
            },
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Check if user is banned
        if (user.status === 'BANNED') {
            throw new UnauthorizedException('Account has been banned');
        }

        // Check if verification status changed
        if (user.isVerified !== payload.isVerified) {
            throw new UnauthorizedException('User verification status has changed');
        }

        // Check if role changed
        if (user.role !== payload.role) {
            throw new UnauthorizedException('User role has changed');
        }

        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            status: user.status,
        };
    }
}

