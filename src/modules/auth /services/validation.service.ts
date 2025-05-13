import {
    Injectable,
    UnauthorizedException,
    ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'src/modules/users /services/users.services';
import { verifyPassword } from '../helper';
import { User } from '@prisma/client';

@Injectable()
export class UserValidationService {
    constructor(private userService: UserService) { }

    async validateUserCredentials(email: string, password: string): Promise<User> {
        const user = await this.userService.findUserByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.deletedAt) {
            throw new ForbiddenException('This account has been deleted');
        }

        const isValidPassword = await verifyPassword(user.password, password);

        if (!isValidPassword) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }


    async validateUserExists(userId: string): Promise<User> {
        const user = await this.userService.findUserById(userId);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        if (user.deletedAt) {
            throw new ForbiddenException('This account has been deleted');
        }

        return user;
    }
}
