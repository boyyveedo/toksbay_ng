import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto {
    @ApiPropertyOptional({ example: 'Entertainment', description: 'New name of the category' })
    @IsOptional()
    @IsString()
    name?: string;
}
