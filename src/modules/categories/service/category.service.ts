import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Inject,
    Logger,
  } from '@nestjs/common';
  import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
  import { CATEGORY_REPOSITORY, ICategoryRepository } from '../interface/category.interface';
  import { Category, Role, User } from '@prisma/client';
  
  @Injectable()
  export class CategoryService {
    private readonly logger = new Logger(CategoryService.name);
  
    constructor(
      @Inject(CATEGORY_REPOSITORY)
      private readonly categoryRepository: ICategoryRepository,
    ) {}
  
    async create(dto: CreateCategoryDto, user: User): Promise<Category> {
      this.logger.debug(`Creating category for userId: ${user.id}, role: ${user.role}, data: ${JSON.stringify(dto)}`);
      try {
        if (user.role !== Role.ADMIN && user.role !== Role.MODERATOR) {
          this.logger.warn(`Unauthorized attempt to create category by userId: ${user.id}, role: ${user.role}`);
          throw new ForbiddenException('Only admins and moderators can create categories');
        }
        const category = await this.categoryRepository.create(dto);
        this.logger.debug(`Category created successfully: ${category.id} by userId: ${user.id}`);
        return category;
      } catch (error) {
        this.logger.error(`Failed to create category for userId: ${user.id}`, error.stack);
        throw error;
      }
    }
  
    async findAll(): Promise<Category[]> {
      this.logger.debug(`Fetching all categories`);
      try {
        const categories = await this.categoryRepository.findAll();
        this.logger.debug(`Retrieved ${categories.length} categories`);
        return categories;
      } catch (error) {
        this.logger.error(`Failed to fetch all categories`, error.stack);
        throw error;
      }
    }
  
    async findById(id: string): Promise<Category> {
      this.logger.debug(`Fetching category with id: ${id}`);
      try {
        const category = await this.categoryRepository.findOne(id);
        if (!category) {
          this.logger.warn(`Category not found for id: ${id}`);
          throw new NotFoundException('Category not found');
        }
        this.logger.debug(`Category fetched successfully: ${id}`);
        return category;
      } catch (error) {
        this.logger.error(`Failed to fetch category with id: ${id}`, error.stack);
        throw error;
      }
    }
  
    async update(id: string, dto: UpdateCategoryDto, user: User): Promise<Category> {
      this.logger.debug(`Updating category with id: ${id} by userId: ${user.id}, role: ${user.role}, data: ${JSON.stringify(dto)}`);
      try {
        if (user.role !== Role.ADMIN) {
          this.logger.warn(`Unauthorized attempt to update category by userId: ${user.id}, role: ${user.role}`);
          throw new ForbiddenException('Only admins can update categories');
        }
        const category = await this.categoryRepository.update(id, dto);
        this.logger.debug(`Category updated successfully: ${id} by userId: ${user.id}`);
        return category;
      } catch (error) {
        this.logger.error(`Failed to update category with id: ${id} for userId: ${user.id}`, error.stack);
        throw error;
      }
    }
  
    async delete(id: string, user: User): Promise<Category> {
      this.logger.debug(`Deleting category with id: ${id} by userId: ${user.id}, role: ${user.role}`);
      try {
        if (user.role !== Role.ADMIN) {
          this.logger.warn(`Unauthorized attempt to delete category by userId: ${user.id}, role: ${user.role}`);
          throw new ForbiddenException('Only admins can delete categories');
        }
        const category = await this.categoryRepository.findOne(id);
        if (!category) {
          this.logger.warn(`Category not found for id: ${id}`);
          throw new NotFoundException('Category not found');
        }
        await this.categoryRepository.delete(id);
        this.logger.debug(`Category deleted successfully: ${id} by userId: ${user.id}`);
        return category;
      } catch (error) {
        this.logger.error(`Failed to delete category with id: ${id} for userId: ${user.id}`, error.stack);
        throw error;
      }
    }
  }