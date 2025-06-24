import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { ICategoryRepository } from '../interface/category.interface';
import slugify from 'slugify';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
  private readonly logger = new Logger(CategoryRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto): Promise<Category> {
    this.logger.debug(`Creating category with data: ${JSON.stringify(dto)}`);
    try {
      const slug = slugify(dto.name, { lower: true });
      const category = await this.prisma.category.create({
        data: { name: dto.name, slug },
      });
      this.logger.debug(`Category created successfully: ${category.id}`);
      return category;
    } catch (error) {
      this.logger.error(`Failed to create category with data: ${JSON.stringify(dto)}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<Category[]> {
    this.logger.debug(`Fetching all categories`);
    try {
      const categories = await this.prisma.category.findMany();
      this.logger.debug(`Retrieved ${categories.length} categories`);
      return categories;
    } catch (error) {
      this.logger.error(`Failed to fetch all categories`, error.stack);
      throw error;
    }
  }

  async findOne(id: string): Promise<Category | null> {
    this.logger.debug(`Fetching category with id: ${id}`);
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      this.logger.debug(`Category ${category ? 'found' : 'not found'} for id: ${id}`);
      return category;
    } catch (error) {
      this.logger.error(`Failed to fetch category with id: ${id}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    this.logger.debug(`Updating category with id: ${id}, data: ${JSON.stringify(dto)}`);
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        this.logger.warn(`Category not found for id: ${id}`);
        throw new NotFoundException('Category not found');
      }

      const slug = dto.name ? slugify(dto.name, { lower: true }) : category.slug;
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: {
          ...dto,
          slug,
        },
      });
      this.logger.debug(`Category updated successfully: ${id}`);
      return updatedCategory;
    } catch (error) {
      this.logger.error(`Failed to update category with id: ${id}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Category not found');
    }
  }

  async delete(id: string): Promise<void> {
    this.logger.debug(`Deleting category with id: ${id}`);
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        this.logger.warn(`Category not found for id: ${id}`);
        throw new NotFoundException('Category not found');
      }

      await this.prisma.category.delete({ where: { id } });
      this.logger.debug(`Category deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete category with id: ${id}`, error.stack);
      throw new NotFoundException('Category not found');
    }
  }
}