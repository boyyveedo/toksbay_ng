import { Module } from '@nestjs/common';
import { UserService } from './users.services';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRepository } from './repository/user.repository';

@Module({
    imports: [

    ],
    controllers: [],
    providers: [
        UserService,
        PrismaService,
        UserRepository,
        {
            provide: 'IUserRepository',
            useClass: UserRepository,
        },
    ],
    exports: [UserService],
})
export class UsersModule { }
