import {
    Controller,
    Post,
    Get,
    Body,
    Req,
    Res,
    HttpCode,
    HttpStatus,
    UseGuards,
    UnauthorizedException,
    Logger
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from '../services';
import { VerificationService } from '../services';
import { PasswordResetService } from '../services/password-reset.service';
import { RegistrationService } from '../services';
import { PasswordManagementService } from '../services';
import { SocialAuthService } from '../services/social-auth.service';
import { User } from '@prisma/client';
import { SignUpDto, SignInDto, RequestPasswordResetDto, ResetPasswordDto, verificationCodeDto } from '../dto';
import { AuthResponseType, RequestPasswordResetResponse, ResetPasswordResponse, VerificationResponse } from '../types';


import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {


    private readonly logger = new Logger(AuthController.name)
    constructor(
        private readonly authService: AuthService,
        private readonly verificationService: VerificationService,
        private readonly passwordResetService: PasswordResetService,
        private readonly registrationService: RegistrationService,
        private readonly passwordManagementService: PasswordManagementService,
        private readonly socialAuthService: SocialAuthService,
    ) { }

    @Post('signup')
    @HttpCode(HttpStatus.CREATED)
    async signUp(@Body() dto: SignUpDto): Promise<AuthResponseType> {
        this.logger.log('Signup route hit');
        try {
            return this.registrationService.signUp(dto);
        } catch (error) {
            this.logger.error('Signup error:', error.message);
            throw error;
        }
    }

    @Post('signin')
    @HttpCode(HttpStatus.OK)
    async signIn(@Body() dto: SignInDto): Promise<AuthResponseType> {
        return this.authService.signIn(dto);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    async verifyEmail(@Body() codeDto: verificationCodeDto): Promise<VerificationResponse> {
        return this.verificationService.verifyEmail(codeDto);
    }

    @Post('resend')
    @HttpCode(HttpStatus.OK)
    async resend(@Body('email') email: string): Promise<{ message: string }> {
        return this.verificationService.resendVerificationEmail(email);
    }

    @Post('request-password-reset')
    @HttpCode(HttpStatus.OK)
    async requestPasswordReset(
        @Body() dto: RequestPasswordResetDto,
    ): Promise<RequestPasswordResetResponse> {
        return this.passwordManagementService.requestPasswordReset(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
        return this.passwordManagementService.resetPassword(dto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Body('refreshToken') refreshToken: string): Promise<void> {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is required');
        }

        try {
            await this.authService.logout(refreshToken);
        } catch (error) {
            throw new UnauthorizedException('Logout failed, invalid refresh token');
        }
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleAuth(): void {
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication failed' });
        }

        const user = req.user as User;
        const authResult = await this.socialAuthService.handleSocialLogin(user);

        return res.status(200).json({
            accessToken: authResult.accessToken,
            refreshToken: authResult.refreshToken,
            user: user,
        });
    }

}
