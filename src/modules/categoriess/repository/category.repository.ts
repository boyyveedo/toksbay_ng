import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { ICategoryRepository } from '../dto/interface/category.interface';
@Injectable()
export class CategoryRepository implements ICategoryRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(dto: CreateCategoryDto): Promise<Category> {
        try {
            return await this.prisma.category.create({ data: dto });
        } catch (err) {
            throw new BadRequestException('Category creation failed');
        }
    }

    async findAll(): Promise<Category[]> {
        return this.prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string): Promise<Category | null> {
        return this.prisma.category.findUnique({ where: { id } });
    }

    async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
        const category = await this.findOne(id);
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.category.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string): Promise<Category> {
        const category = await this.findOne(id);
        if (!category) throw new NotFoundException('Category not found');

        return this.prisma.category.delete({ where: { id } });
    }
}
