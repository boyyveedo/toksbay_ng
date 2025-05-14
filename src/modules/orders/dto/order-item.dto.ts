import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';



export class OrderItemDto {
    @IsUUID()
    @IsNotEmpty()
    productId: string;
  
    @IsNumber()
    @Min(1)
    quantity: number;
  }
  