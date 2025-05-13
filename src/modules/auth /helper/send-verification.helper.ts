import { EmailService } from 'src/infrastructure/services/mail';
import { SignUpDto } from '../dto';
export const sendVerificationEmail = async (emailService: EmailService, user: SignUpDto, verificationCode: string) => {
    try {
        await emailService.sendVerificationEmail({
            subject: 'Email Verification',
            email: user.email,
            name: user.firstName,
            verificationCode,
            template: './activation-mail',
        });
        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Email service failed.');
    }
};