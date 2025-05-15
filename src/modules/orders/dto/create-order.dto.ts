import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType,  } from '@prisma/client';
import { AddressDto } from './address.dto';


export class CreateOrderDto {
    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;
  
  
    @IsEnum(PaymentType)
    @IsOptional()
    paymentType?: PaymentType;

    @IsString() 
    @IsNotEmpty()
    userId: string;  
  }

  