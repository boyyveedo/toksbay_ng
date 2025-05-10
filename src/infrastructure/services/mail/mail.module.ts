import { Global, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { EmailService } from './mail.services';

@Global()
@Module({
    imports: [
        ConfigModule,
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                transport: {
                    host: configService.get('SMTP_HOST'),
                    port: configService.get('SMTP_PORT'),
                    secure: true,
                    auth: {
                        user: configService.get('SMTP_MAIL'),
                        pass: configService.get('SMTP_PASSWORD'),
                    },
                },
                defaults: {
                    from: 'Kolabbb',
                },
                template: {
                    dir: join(process.cwd(), 'libs/mail/src/email-templates'),
                    adapter: new EjsAdapter(),
                    options: {
                        strict: false,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [EmailService],
    exports: [MailerModule, EmailService],
})
export class EmailModule { }