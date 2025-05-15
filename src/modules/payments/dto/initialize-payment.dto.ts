import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';

export class InitializePaymentDto {
  @IsEmail()
  email: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  reference?: string;

  @IsOptional()
  metadata?: any;
}