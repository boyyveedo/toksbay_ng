import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './services/users.services';
import { UserRepository } from './repository/user.repository';
// import { UserQueryService } from './services/users-query.services';
// import { UserMutationService } from './services/users.mutation.services';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auths/auth.module';
import { PasswordService, VerificationService } from '../auths/services';
import { VerificationHelper, VerifyEmailHelper } from '../auths/helper';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserController } from './controllers/user.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [
        forwardRef(() => AuthModule),
        CommonModule,
    ],
    controllers: [UserController],
    providers: [
        UsersService,
        PrismaService,
        UserRepository,
        PasswordService,
        {
            provide: 'IUserRepository',
            useClass: UserRepository,
        },


    ],
    exports: [
        UsersService,


        { provide: 'IUserRepository', useClass: UserRepository },
    ],
})
export class UserModule { }