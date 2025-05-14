import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';
import { ICategoryRepository } from '../interface/category.interface';
import slugify from 'slugify';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCategoryDto): Promise<Category> {
        const slug = slugify(dto.name, { lower: true });
        return this.prisma.category.create({
            data: { name: dto.name, slug },
        });
    }

    async findAll(): Promise<Category[]> {
        return this.prisma.category.findMany();
    }

    async findOne(id: string): Promise<Category | null> {
        return this.prisma.category.findUnique({ where: { id } });
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.prisma.category.findUnique({ where: { id } });
        if (!category) throw new NotFoundException('Category not found');

        const slug = dto.name ? slugify(dto.name, { lower: true }) : category.slug;
        return this.prisma.category.update({
            where: { id },
            data: {
                ...dto,
                slug,
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.category.delete({ where: { id } });
    }
}
