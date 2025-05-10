
import { Injectable } from '@nestjs/common';
import { hashPassword, verifyPassword } from '../helper';
@Injectable()
export class PasswordService {
    async hashPassword(password: string): Promise<string> {
        return hashPassword(password);
    }

    async verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
        return verifyPassword(hashedPassword, plainPassword);
    }
}
