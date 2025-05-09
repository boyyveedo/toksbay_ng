import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class SignUpDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    firstName: string;

    @IsString()
    lastName: string;

    @IsOptional()
    @IsEnum(Role)
    role: Role = Role.CUSTOMER;
}

export class SignInDto {
    @IsEmail()
    @IsNotEmpty()

    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;

}
