import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

type MailOptions = {
    subject: string;
    email: string;
    name: string;
    verificationCode?: string;
    template: string;
    resetLink?: string
};

@Injectable()
export class EmailService {
    constructor(private readonly mailService: MailerService) { }

    async sendVerificationEmail({
        subject,
        email,
        name,
        verificationCode,
        template,
        resetLink


    }: MailOptions): Promise<void> {
        try {
            await this.mailService.sendMail({
                to: email,
                subject,
                template,
                context: {
                    name,
                    verificationCode,
                    resetLink
                },
            });
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Error sending verification email.');
        }
    }
}
