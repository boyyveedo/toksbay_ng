import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
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

    setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        
        // Use 'lax' instead of 'strict' for OAuth compatibility
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax', // Changed from 'strict' to 'lax'
            maxAge: 15 * 60 * 1000, // 15 minutes
            path: '/',
        });

        // Set refresh token cookie (longer expiry)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax', // Changed from 'strict' to 'lax'
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/', // Changed from '/api/v1/auth/refresh' to '/' for OAuth compatibility
        });
    }

    // Clear cookies on logout
    clearTokenCookies(res: Response) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken'); // Remove the path restriction
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