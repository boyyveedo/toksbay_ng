import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType,  } from '@prisma/client';
import { AddressDto } from './address.dto';
import { OrderItemDto } from './order-item.dto';


export class CreateOrderDto {
    @ValidateNested()
    @Type(() => AddressDto)
    address: AddressDto;
  
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
  
    @IsEnum(PaymentType)
    @IsOptional()
    paymentType?: PaymentType;
  }

  