import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { Condition } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterProductDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    categoryId?: string;

    @ApiPropertyOptional({ enum: Condition })
    @IsOptional()
    @IsEnum(Condition)
    condition?: Condition;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumberString()
    limit?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumberString()
    offset?: string;

    @ApiPropertyOptional({ enum: ['createdAt', 'price'] })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'price';

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}
