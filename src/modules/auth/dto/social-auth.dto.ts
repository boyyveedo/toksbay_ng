import { IsEmail, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateSocialUserDto {
    @IsEmail()
    email: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsString()
    providerId: string;

    @IsString()
    provider: string;

    @IsBoolean()
    isEmailVerified: boolean;
}
