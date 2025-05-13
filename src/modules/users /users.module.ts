import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './services/users.services';
import { UserRepository } from './repository/user.repository';
// import { UserQueryService } from './services/users-query.services';
// import { UserMutationService } from './services/users.mutation.services';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth /auth.module';
import { PasswordService, VerificationService } from '../auth /services';
import { VerificationHelper, VerifyEmailHelper } from '../auth /helper';
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
        UserService,
        PrismaService,
        UserRepository,
        PasswordService,
        {
            provide: 'IUserRepository',
            useClass: UserRepository,
        },


    ],
    exports: [
        UserService,


        { provide: 'IUserRepository', useClass: UserRepository },
    ],
})
export class UserModule { }