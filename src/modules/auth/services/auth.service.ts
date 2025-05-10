import { Injectable, Logger, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { SignInDto } from '../dto';
import { AuthResponseType } from '../types';
import { TokenService } from './token.service';
import { UserValidationService } from './validation.service';
import { UserMapper } from 'src/modules/users/user.mapper';
import { IAuthService } from '../interface';
import { SessionService } from './session.service';

@Injectable()
export class AuthService implements IAuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private tokenService: TokenService,
        private userValidationService: UserValidationService,
        private sessionService: SessionService,
    ) { }

    async signIn(dto: SignInDto): Promise<AuthResponseType> {
        this.logger.log(`Attempting to sign in user with email: ${dto.email}`);

        try {
            const user = await this.userValidationService.validateUserCredentials(
                dto.email,
                dto.password
            );

            this.logger.log(`User validated with ID: ${user.id}`);

            if (!user.isVerified) {
                this.logger.warn(`User email not verified: ${user.email}`);
                throw new ForbiddenException('Please verify your email before signing in.');
            }

            if (user.status === 'BANNED') {
                throw new ForbiddenException('This account has been banned');
            }

            const { accessToken, refreshToken } = await this.tokenService.generateTokens(
                user.id,
                user.email,
                user.isVerified,
                user.role
            );

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            await this.sessionService.createSession(user.id, refreshToken, expiresAt);

            return {
                accessToken,
                refreshToken,
                user: UserMapper.toResponseDto(user),
            };
        } catch (error) {
            this.logger.warn(`Sign-in failed for email: ${dto.email}`, error.stack);
            throw error;
        }
    }

    async refreshTokens(refreshToken: string): Promise<AuthResponseType> {
        this.logger.log('Attempting to refresh tokens');

        try {
            const { userId, email } = await this.tokenService.validateRefreshToken(refreshToken);
            const user = await this.userValidationService.validateUserExists(userId);

            if (user.status === 'BANNED') {
                throw new ForbiddenException('This account has been banned');
            }

            const tokens = await this.tokenService.generateTokens(userId, email, user.isVerified, user.role);

            return {
                ...tokens,
                user: UserMapper.toResponseDto(user),
            };
        } catch (error) {
            this.logger.warn('Token refresh failed', error.stack);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }


    async logout(refreshToken: string): Promise<void> {
        this.logger.log(`Attempting to log out user with refresh token: ${refreshToken}`);

        try {
            const { userId } = await this.tokenService.validateRefreshToken(refreshToken);
            await this.sessionService.deleteSessionByToken(userId);

            this.logger.log(`Successfully logged out user with ID: ${userId}`);
        } catch (error) {
            this.logger.warn(`Logout failed for refresh token: ${refreshToken}`, error.stack);
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
