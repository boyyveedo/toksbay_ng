import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsNumber,
    IsEnum,
    IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Condition } from '@prisma/client';
import type { Express } from 'express';
export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    title: string;

    @IsNotEmpty()
    @IsString()
    description: string;

    @IsNumber()
    @Type(() => Number)
    price: number;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    discountPrice?: number;

    @IsString()
    categoryId: string;

    @IsOptional()
    @IsString()
    brand?: string;

    @IsEnum(Condition)
    condition: Condition;

    @IsOptional()
    @IsArray()
    images?: Express.Multer.File[];
}
