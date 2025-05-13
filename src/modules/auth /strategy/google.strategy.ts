// google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/users /services/users.services';
import { RegistrationService } from '../services';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private configService: ConfigService,
        private userService: UserService,
        private registrationService: RegistrationService,

    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
            scope: ['email', 'profile'],
        });

        if (!configService.get<string>('GOOGLE_CLIENT_ID') ||
            !configService.get<string>('GOOGLE_CLIENT_SECRET') ||
            !configService.get<string>('GOOGLE_CALLBACK_URL')) {
            throw new Error('Missing Google OAuth configuration. Check your environment variables.');
        }
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<any> {
        const { name, emails } = profile;

        if (!emails || !emails[0] || !emails[0].value) {
            return done(new Error('No email found in Google profile'), undefined);
        }

        const userData = {
            email: emails[0].value,
            firstName: name?.givenName || '',
            lastName: name?.familyName || '',
            providerId: profile.id,
            provider: 'google',
            accessToken,
        };

        try {
            const user = await this.registrationService.findOrCreateSocialUser(userData);
            return done(null, user);
        } catch (error) {
            return done(error, undefined);
        }
    }
}