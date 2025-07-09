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
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService, TokenService } from '../services';
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

// New response type for secure auth without exposing tokens
export interface SecureAuthResponse {
  user: any; 
  message: string;
}

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
    private readonly tokenService : TokenService
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 signups per minute
  @ApiOperation({ summary: 'User Registration' })  
  @ApiResponse({ status: 201, description: 'User created successfully.' })  
  @ApiResponse({ status: 400, description: 'Bad request.' })  
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
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
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @ApiOperation({ summary: 'User Sign-In' })
  @ApiResponse({ status: 200, description: 'Successful login. Tokens set in HTTP-only cookies.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiBody({ type: SignInDto })
  async signIn(
    @Body() dto: SignInDto, 
    @Res({ passthrough: true }) res: Response
  ): Promise<SecureAuthResponse> {
    const tokens = await this.authService.signIn(dto);
    
    this.tokenService.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    
    return {
      user: tokens.user,
      message: 'Login successful'
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 verification attempts per minute
  @ApiOperation({ summary: 'Verify Email' })
  @ApiResponse({ status: 200, description: 'Email verified successfully.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiBody({ type: verificationCodeDto })
  async verifyEmail(@Body() codeDto: verificationCodeDto): Promise<VerificationResponse> {
    return this.verificationService.verifyEmail(codeDto);
  }

  @Post('resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 resend attempts per 5 minutes
  @ApiOperation({ summary: 'Resend Verification Email' })
  @ApiResponse({ status: 200, description: 'Verification email resent.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiBody({ type: ResendVerificationDto }) 
  async resend(@Body() dto: ResendVerificationDto): Promise<{ message: string }> {
    return this.verificationService.resendVerificationEmail(dto.email);
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 2, ttl: 300000 } }) // 2 password reset requests per 5 minutes
  @ApiOperation({ summary: 'Request Password Reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiBody({ type: RequestPasswordResetDto })
  async requestPasswordReset(
    @Body() dto: RequestPasswordResetDto,
  ): Promise<RequestPasswordResetResponse> {
    return this.passwordManagementService.requestPasswordReset(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 password reset attempts per 15 minutes
  @ApiOperation({ summary: 'Reset Password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<ResetPasswordResponse> {
    return this.passwordManagementService.resetPassword(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 logout attempts per minute (generous)
  @ApiOperation({ summary: 'Logout user by invalidating refresh token' })
  @ApiResponse({ status: 200, description: 'Successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - No refresh token provided.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<{ message: string }> {
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
  
    await this.authService.logout(refreshToken);
    
    // Clear cookies
    this.tokenService.clearTokenCookies(res);
    
    return { message: 'Successfully logged out' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 refresh attempts per minute
  @ApiOperation({ summary: 'Refresh Access Token using HTTP-only cookie' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully. New tokens set in HTTP-only cookies.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing refresh token.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<SecureAuthResponse> {
    const refreshToken = req.cookies?.refreshToken;
  
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
  
    try {
      const tokens = await this.authService.refreshTokens(refreshToken);
      
      // Set new tokens in HTTP-only cookies
      this.tokenService.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
      
      // Return only user data and success message
      return {
        user: tokens.user,
        message: 'Tokens refreshed successfully'
      };
    } catch (error) {
      this.logger.warn('Refresh token failed:', error.message);
      
      // Clear potentially invalid cookies
      this.tokenService.clearTokenCookies(res);
      
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @SkipThrottle() // Skip throttling for OAuth redirects
  @ApiOperation({ summary: 'Google Authentication' })
  @ApiResponse({ status: 302, description: 'Redirects to Google login page.' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  googleAuth(): void {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 OAuth callbacks per minute
  @ApiOperation({ summary: 'Google Authentication Callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend after setting authentication cookies' })
  @ApiResponse({ status: 401, description: 'Google Authentication failed.' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Google auth callback reached');
    
    if (!req.user) {
      this.logger.error('Authentication failed: No user in request');
      return res.redirect('https://soloshopp.netlify.app/auth/failed');
    }

    try {
      const user = req.user as User;
      const authResult = await this.socialAuthService.handleSocialLogin(user);
      
      // Set tokens in HTTP-only cookies
      this.tokenService.setTokenCookies(res, authResult.accessToken, authResult.refreshToken);
      
      // Redirect without exposing tokens in URL
      return res.redirect('https://soloshopp.netlify.app/auth/success');
    } catch (error) {
      this.logger.error(`Google auth callback error: ${error.message}`);
      return res.redirect('https://soloshow.netlify.com/auth/failed');
    }
  }

  // Optional: Add an endpoint to check if user is authenticated
  @Get('status')
  @HttpCode(HttpStatus.OK)
  @SkipThrottle() // Skip throttling for status checks - users check this frequently
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'User is authenticated.' })
  @ApiResponse({ status: 401, description: 'User is not authenticated.' })
  async checkAuthStatus(@Req() req: Request): Promise<{ isAuthenticated: boolean; user?: any }> {
    const accessToken = req.cookies?.accessToken;
    
    if (!accessToken) {
      return { isAuthenticated: false };
    }
    
    try {
      // Validate access token (you might need to implement this in TokenService)
      const user = await this.tokenService.validateAccessToken(accessToken);
      return { 
        isAuthenticated: true,
        user: user 
      };
    } catch (error) {
      return { isAuthenticated: false };
    }
  }
}