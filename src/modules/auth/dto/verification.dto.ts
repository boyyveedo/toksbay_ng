import { IsNotEmpty, IsInt, IsString, MinLength, IsUUID } from 'class-validator';

export class verificationCodeDto {
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty({ message: "verification code is required" })
    verificationCode: string;

}