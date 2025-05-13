import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
    CreateProductDto,
    FilterProductDto,
    UpdateProductDto,
} from '../dto';
import { Product, Condition } from '@prisma/client';
import { IProductRepository } from '../interface/product.interface';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

type ProductWithImages = Product & {
    images: { id: string; url: string; productId: string }[];
};

@Injectable()
export class ProductRepository implements IProductRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
    ) { }

    private async uploadImages(files: Express.Multer.File[], productId: string) {
        return Promise.all(
            files.map(async (file) => {
                const url = await this.cloudinaryService.uploadImage(
                    file.buffer,
                    `${productId}-${Date.now()}`,
                );
                return this.prisma.productImage.create({
                    data: { url, productId },
                });
            }),
        );
    }

    async create(
        sellerId: string,
        dto: CreateProductDto,
    ): Promise<ProductWithImages> {
        const { images, categoryId, ...productData } = dto;

        const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) throw new BadRequestException('Invalid category ID');

        const product = await this.prisma.product.create({
            data: {
                ...productData,
                sellerId,
                categoryId,
            },
        });

        if (images?.length) {
            await this.uploadImages(images, product.id);
        }

        const result = await this.prisma.product.findUnique({
            where: { id: product.id },
            include: { images: true },
        });

        if (!result) throw new NotFoundException('Product creation failed');

        return result;
    }

    async findAll(filter: FilterProductDto): Promise<ProductWithImages[]> {
        const {
            search,
            categoryId,
            condition,
            limit = 20,
            offset = 0,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = filter;

        return this.prisma.product.findMany({
            where: {
                title: search
                    ? { contains: search, mode: 'insensitive' }
                    : undefined,
                categoryId: categoryId || undefined,
                condition: condition as Condition,
            },
            take: Number(limit),
            skip: Number(offset),
            orderBy: { [sortBy]: sortOrder },
            include: { images: true },
        });
    }

    async findOne(id: string): Promise<ProductWithImages | null> {
        return this.prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });
    }

    async update(
        productId: string,
        dto: UpdateProductDto,
        files?: Express.Multer.File[],
    ): Promise<ProductWithImages> {
        const { images, categoryId, ...updateData } = dto;

        // ✅ Optionally check if categoryId is being updated and is valid
        if (categoryId) {
            const exists = await this.prisma.category.findUnique({
                where: { id: categoryId },
            });
            if (!exists) throw new BadRequestException('Invalid category ID');
        }

        const updatedProduct = await this.prisma.product.update({
            where: { id: productId },
            data: {
                ...updateData,
                ...(categoryId && { categoryId }),
            },
        });

        if (files?.length) {
            await this.prisma.productImage.deleteMany({ where: { productId } });
            await this.uploadImages(files, productId);
        }

        const result = await this.prisma.product.findUnique({
            where: { id: updatedProduct.id },
            include: { images: true },
        });

        if (!result) throw new NotFoundException('Updated product not found');
        return result;
    }

    async delete(id: string): Promise<Product> {
        return this.prisma.product.delete({
            where: { id },
        });
    }
}
