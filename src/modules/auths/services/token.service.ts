import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async generateTokens(userId: string, email: string, isVerified: boolean, role: string) {
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                    isVerified,
                    role
                },
                {
                    secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                    expiresIn: '1h',
                },
            ),
            this.jwtService.signAsync(
                {
                    sub: userId,
                    email,
                },
                {
                    secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                    expiresIn: '7d',
                },
            ),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    async validateRefreshToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            });
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired refresh token');
        }
    }

    async validateAccessToken(token: string) {
        try {
            return await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            });
        } catch (err) {
            throw new UnauthorizedException('Invalid or expired access token');
        }
    }
}
