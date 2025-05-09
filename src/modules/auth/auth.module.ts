import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { UserService } from '../users/users.services';
import { AuthController } from './controllers/auth.controller';

@Module({
    imports: [UsersModule],
    controllers: [AuthController],
    providers: [UserService],
})
export class AuthModule { }
