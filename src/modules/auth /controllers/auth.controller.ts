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
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';  
import { AuthGuard } from '@nestjs/passport';
import { ResendVerificationDto } from '../dto';
import { LogoutDto } from '../dto/logout.dto';

@ApiTags('Authentication')  
@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly passwordResetService: PasswordResetService,
    private readonly registrationService: RegistrationService,
    private readonly passwordManagementService: PasswordManagementService,
    private readonly socialAuthService: SocialAuthService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Registration' })  
  @ApiResponse({ status: 201, description: 'User created successfully.' })  
  @ApiResponse({ status: 400, description: 'Bad request.' })  
  @ApiBody({ type: SignUpDto })  
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
  @ApiOperation({ summary: 'User Sign-In' })
  @ApiResponse({ status: 200, description: 'Successful login.' })
  @ApiBody({ type: SignInDto })
  async signIn(@Body() dto: SignInDto): Promise<AuthResponseType> {
    return this.authService.signIn(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiBody({ type: verificationCodeDto })
  async verifyEmail(@Body() codeDto: verificationCodeDto): Promise<VerificationResponse> {
    return this.verificationService.verifyEmail(codeDto);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend Verification Email' })
  @ApiResponse({ status: 200, description: 'Verification email resent.' })
  @ApiBody({ type: ResendVerificationDto }) 
  async resend(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    return this.verificationService.resendVerificationEmail(dto.email);
  }
  

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request Password Reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiBody({ type: RequestPasswordResetDto })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    return this.passwordManagementService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset Password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    return this.passwordManagementService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout User' })
  @ApiResponse({ status: 200, description: 'User logged out successfully.' })
  @ApiBody({ type: LogoutDto, description: 'Refresh token' })  
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
  @ApiOperation({ summary: 'Google Authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  googleAuth(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google Authentication Callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with authentication tokens' })
  @ApiResponse({ status: 401, description: 'Google Authentication failed.' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Google auth callback reached');
    
    if (!req.user) {
      this.logger.error('Authentication failed: No user in request');
      return res.status(401).json({ message: 'Authentication failed' });
    }

    try {
      const user = req.user as User;
      const authResult = await this.socialAuthService.handleSocialLogin(user);
      
      return res.redirect(`http://Localhost:5173/auth/google/callback?token=${authResult.accessToken}`);
    } catch (error) {
      this.logger.error(`Google auth callback error: ${error.message}`);
      return res.status(500).json({ message: 'Authentication processing failed' });
    }
  }
}
