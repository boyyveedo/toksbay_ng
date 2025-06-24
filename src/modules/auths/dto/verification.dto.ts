import { IsNotEmpty, IsInt, IsString, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class verificationCodeDto {
    @ApiProperty({ example: '2c88e24e-d9f5-40ff-a9cb-1795c7154de4' })
    @IsUUID()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty({ message: "verification code is required" })
    verificationCode: string;

}