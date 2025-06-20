import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CategoryService } from '../service/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from 'src/common/decorators';
import { RolesGuard } from 'src/common/guards';
import { Role, User } from '@prisma/client';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
} from '@nestjs/swagger';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post('create')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Create a new category (Admin only)' })
    @ApiResponse({ status: 201, description: 'Category successfully created' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only Admins can create categories.' })
    create(@Body() dto: CreateCategoryDto, @GetUser() user: User) {
        return this.categoryService.create(dto, user);
    }

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'List of all categories' })
    findAll() {
        return this.categoryService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a category by ID' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category found' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    findById(@Param('id') id: string) {
        return this.categoryService.findById(id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN, Role.MODERATOR)
    @ApiOperation({ summary: 'Update a category by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only Admins can update categories.' })
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
        @GetUser() user: User,
    ) {
        return this.categoryService.update(id, dto, user);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN , Role.MODERATOR)
    @ApiOperation({ summary: 'Delete a category by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Category deleted successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden. Only Admins can delete categories.' })
    delete(@Param('id') id: string, @GetUser() user: User) {
        return this.categoryService.delete(id, user);
    }
}
