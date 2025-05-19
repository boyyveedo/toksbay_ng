import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
  @ApiProperty({ example: 'paystack_ref_abc123' })
  @IsString()
  reference: string;
}
