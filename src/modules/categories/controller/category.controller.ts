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



@Controller('categories')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) { }

    @Post('create')
    @Roles(Role.ADMIN)
    create(@Body() dto: CreateCategoryDto, @GetUser() user: User) {
        return this.categoryService.create(dto, user);
    }

    @Get()
    findAll() {
        return this.categoryService.findAll();
    }

    @Get(':id')
    findById(@Param('id') id: string) {
        return this.categoryService.findById(id);
    }

    @Patch(':id')
    @Roles(Role.ADMIN)
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
        @GetUser() user: User,
    ) {
        return this.categoryService.update(id, dto, user);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    delete(@Param('id') id: string, @GetUser() user: User) {
        return this.categoryService.delete(id, user);
    }
}
