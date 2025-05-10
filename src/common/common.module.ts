import { Module } from '@nestjs/common';
import { PasswordService } from 'src/modules/auth/services';

@Module({
    providers: [PasswordService],
    exports: [PasswordService],
})
export class CommonModule { }
