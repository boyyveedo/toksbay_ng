import { Product } from '@prisma/client';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from '../dto';
import type { Express } from 'express';

export type ProductWithImages = Product & {
    images: { id: string; url: string; productId: string }[]
};

export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';

export interface IProductRepository {
    create(userId: string, dto: CreateProductDto): Promise<ProductWithImages>;
    findAll(filter: FilterProductDto): Promise<ProductWithImages[]>;
    findOne(id: string): Promise<ProductWithImages | null>;
    update(id: string, dto: UpdateProductDto, files?: Express.Multer.File[]): Promise<ProductWithImages>;
    delete(id: string): Promise<Product>;
}