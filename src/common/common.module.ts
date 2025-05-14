import { Module } from '@nestjs/common';
// import { APP_GUARD } from '@nestjs/core';

import { CloudinaryService } from './cloudinary/cloudinary.service';

import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { RolesGuard } from './guards/roles.guard';
import { VerifiedUserGuard } from './guards/verified-user.guard';

@Module({
    providers: [
        CloudinaryService,

        // Keep individual guard classes for @UseGuards()
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,

        VerifiedUserGuard,

        // // Only register truly global guards
        // {
        //     provide: APP_GUARD,
        //     useClass: JwtAuthGuard, // Keep auth as global
        // },
        // {
        //     provide: APP_GUARD,
        //     useClass: RolesGuard, // Keep roles as global if needed
        // },
        // // Remove the other global registrations
    ],
    exports: [
        // Keep all exports
        CloudinaryService,
        JwtAuthGuard,
        JwtRefreshGuard,
        RolesGuard,
        
        VerifiedUserGuard,
    ],
})
export class CommonModule { }