import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Condition } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Express } from 'express';

export class CreateProductDto {
    @ApiProperty({ example: 'Camera', description: 'Title of the product' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ example: 'High quality DSLR', description: 'Product description' })
    @IsNotEmpty()
    @IsString()
    description: string;

    @ApiProperty({ example: 100000, description: 'Price of the product' })
    @IsNumber()
    @Type(() => Number)
    price: number;

    @ApiPropertyOptional({ example: 80000, description: 'Discounted price' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    discountPrice?: number;

    @ApiProperty({ example: 'categoryId123', description: 'Category ID' })
    @IsString()
    categoryId: string;

    @ApiPropertyOptional({ example: 'Canon', description: 'Brand of the product' })
    @IsOptional()
    @IsString()
    brand?: string;

    @ApiProperty({ enum: Condition, example: Condition.NEW })
    @IsEnum(Condition)
    condition: Condition;

    @ApiPropertyOptional({ type: 'array', items: { type: 'string', format: 'binary' } })
    @IsOptional()
    @IsArray()
    images?: Express.Multer.File[];
}
