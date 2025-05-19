import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({ example: 'Sports', description: 'Name of the category' })
    @IsString()
    @IsNotEmpty()
    name: string;
}
