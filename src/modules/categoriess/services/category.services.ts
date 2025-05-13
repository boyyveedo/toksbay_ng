import { Injectable, NotFoundException, Logger, Inject } from '@nestjs/common';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ICategoryRepository, CATEGORY_REPOSITORY } from '../dto/interface/category.interface';
@Injectable()
export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);

    constructor(
        @Inject(CATEGORY_REPOSITORY)
        private readonly categoryRepo: ICategoryRepository,
    ) { }

    async createCategory(dto: CreateCategoryDto) {
        this.logger.log(`Creating category: ${dto.name}`);
        return this.categoryRepo.create(dto);
    }

    async getAllCategories() {
        this.logger.log(`Fetching all categories`);
        return this.categoryRepo.findAll();
    }

    async getCategoryById(id: string) {
        const category = await this.categoryRepo.findOne(id);
        if (!category) throw new NotFoundException('Category not found');
        return category;
    }

    async updateCategory(id: string, dto: UpdateCategoryDto) {
        this.logger.log(`Updating category ID: ${id}`);
        return this.categoryRepo.update(id, dto);
    }

    async deleteCategory(id: string) {
        this.logger.log(`Deleting category ID: ${id}`);
        return this.categoryRepo.delete(id);
    }
}
