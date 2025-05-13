import { Module } from '@nestjs/common';
import { PasswordService } from 'src/modules/auth /services';
import { CloudinaryService } from './cloudinary/cloudinary.service';

@Module({
    providers: [PasswordService, CloudinaryService],
    exports: [PasswordService, CloudinaryService],
})
export class CommonModule { }
