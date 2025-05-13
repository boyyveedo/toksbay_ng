// dto/filter-product.dto.ts
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { Condition } from '@prisma/client';

export class FilterProductDto {
    @IsOptional() @IsString() search?: string;
    @IsOptional() @IsString() categoryId?: string;
    @IsOptional() @IsEnum(Condition) condition?: Condition;
    @IsOptional() @IsNumberString() limit?: string;
    @IsOptional() @IsNumberString() offset?: string;
    @IsOptional() @IsString() sortBy?: 'createdAt' | 'price';
    @IsOptional() @IsString() sortOrder?: 'asc' | 'desc';
}
