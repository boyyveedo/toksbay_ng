import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
    IsOptional,
    IsEnum,
  } from 'class-validator';
  import { Role } from '@prisma/client';
  import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
  
  export class SignUpDto {
    @ApiProperty({
      description: 'The email of the user',
      example: 'user@example.com',
    })
    @IsEmail()
    email: string;
  
    @ApiProperty({
      description: 'The password of the user',
      example: 'password123',
      minLength: 6,
    })
    @IsString()
    @MinLength(6)
    password: string | null;
  
    @ApiProperty({
      description: 'First name of the user',
      example: 'John',
    })
    @IsString()
    firstName: string;
  
    @ApiProperty({
      description: 'Last name of the user',
      example: 'Doe',
    })
    @IsString()
    lastName: string;
  
    @ApiPropertyOptional({
      description: 'User role (optional)',
      enum: Role,
      default: Role.CUSTOMER,
    })
    @IsOptional()
    @IsEnum(Role)
    role: Role = Role.CUSTOMER;
  }
  
  export class SignInDto {
    @ApiProperty({
      description: 'Email address of the user',
      example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;
  
    @ApiProperty({
      description: 'User password',
      example: 'password123',
    })
    @IsString()
    @IsNotEmpty()
    password: string;
  }
  