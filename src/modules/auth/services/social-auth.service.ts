import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from './token.service';
import { UserMapper } from 'src/modules/users/user.mapper';
import { AuthResponseType } from '../types';
import { User } from '@prisma/client';

@Injectable()
export class SocialAuthService {
    private readonly logger = new Logger(SocialAuthService.name);

    constructor(private tokenService: TokenService) { }

    async handleSocialLogin(user: User): Promise<AuthResponseType> {
        this.logger.log(`Processing social login for user ID: ${user.id}`);

        const { accessToken, refreshToken } = await this.tokenService.generateTokens(
            user.id,
            user.email,
            user.isVerified,
            user.role
        );

        return {
            accessToken,
            refreshToken,
            user: UserMapper.toResponseDto(user),
        };
    }
}
