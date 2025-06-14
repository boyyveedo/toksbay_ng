import {
    Injectable,
    NotFoundException,
    ForbiddenException, Inject

} from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { CATEGORY_REPOSITORY, ICategoryRepository } from '../interface/category.interface';
import { Category, Role, User } from '@prisma/client';

@Injectable()
export class CategoryService {
    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepository: ICategoryRepository) { }

    async create(dto: CreateCategoryDto, user: User): Promise<Category> {
        // if (user.role !== Role.ADMIN) {
        //     throw new ForbiddenException('Only admins can create categories');
        // }
        return this.categoryRepository.create(dto);
    }

    async findAll(): Promise<Category[]> {
        return this.categoryRepository.findAll();
    }

    async findById(id: string): Promise<Category> {
        const category = await this.categoryRepository.findOne(id);
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async update(
        id: string,
        dto: UpdateCategoryDto,
        user: User,
    ): Promise<Category> {
        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can update categories');
        }

        return this.categoryRepository.update(id, dto);
    }

    async delete(id: string, user: User): Promise<Category> {
        if (user.role !== Role.ADMIN) {
            throw new ForbiddenException('Only admins can delete categories');
        }

        const category = await this.categoryRepository.findOne(id);
        if (!category) throw new NotFoundException('Category not found');

        await this.categoryRepository.delete(id);
        return category;
    }
}
