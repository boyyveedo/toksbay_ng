import { IsString, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Reset token is required' })
    resetToken: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    @MinLength(8, { message: 'New password must be at least 8 characters long' })
    newPassword: string;

    @IsString()
    @IsNotEmpty({ message: 'Confirm password is required' })
    @MinLength(8, { message: 'Confirm password must be at least 8 characters long' })
    confirmPassword: string;
}