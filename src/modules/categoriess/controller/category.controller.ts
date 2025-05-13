// controllers/category.controller.ts
import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
} from '@nestjs/common';
import { CategoryService } from '../services/category.services';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Roles } from 'src/common/decorators';
import { Role } from '@prisma/client';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/common/guards';

@Controller('categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post()
    @Roles(Role.ADMIN)
    create(@Body() dto: CreateCategoryDto) {
        return this.categoryService.createCategory(dto);
    }

    @Get()
    getAll() {
        return this.categoryService.getAllCategories();
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.categoryService.getCategoryById(id);
    }

    @Put(':id')
    @Roles(Role.ADMIN)
    update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
        return this.categoryService.updateCategory(id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    delete(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }
}
