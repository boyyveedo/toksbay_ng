import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { TokenService } from './services';
import { UserValidationService } from './services';
import { EmailModule } from 'src/infrastructure/services/mail';
import { EmailService } from 'src/infrastructure/services/mail';
import { VerificationService } from './services';
import { VerificationHelper, VerifyEmailHelper } from './helper';
import { PasswordResetService } from './services/password-reset.service';
import { AuthHelper } from './helper';
import { PasswordManagementService } from './services';
import { RegistrationService } from './services';
import { SessionService } from './services';
import { UserModule } from '../users /users.module';
import { PasswordService } from './services';
import { SocialAuthService } from './services/social-auth.service';
import { GoogleStrategy } from './strategy/google.strategy';
import { CommonModule } from 'src/common/common.module';
import { RolesGuard } from 'src/common/guards';

@Module({
    imports: [
        CommonModule,
        forwardRef(() => UserModule),
        JwtModule.register({}),
        EmailModule,
        PrismaModule,
    ],
    controllers: [AuthController],
    providers: [
        SessionService,
        AuthService,
        JwtStrategy,
        PasswordManagementService,
        RegistrationService,
        TokenService,
        PasswordService,
        UserValidationService,
        EmailService,
        VerificationService,
        VerificationHelper,
        VerifyEmailHelper,
        PasswordResetService,
        AuthHelper,
        SocialAuthService,
        GoogleStrategy,
    ],
    exports: [
        AuthService,
        RegistrationService,
        PasswordManagementService,
        VerificationService,
        VerifyEmailHelper,
        EmailService,
        PasswordService,
        TokenService,
        UserValidationService,
        PasswordResetService,
        AuthHelper,
        SessionService,
        SocialAuthService,

    ],
})
export class AuthModule { }