import { IsEmail, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, } from '@nestjs/swagger';

export class InitializePaymentDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 5000, description: 'Amount in kobo (₦50.00 = 5000)' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 'pay_ref_123456' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({
    type: 'object',
    description: 'Flexible metadata key-value pairs',
    additionalProperties: {},  
  })
  @IsOptional()
  metadata?: any;
}
