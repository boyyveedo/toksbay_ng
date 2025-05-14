import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
    Inject
} from '@nestjs/common';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from '../dto';
import { IProductRepository, PRODUCT_REPOSITORY } from '../interface/product.interface';
import { Role } from '@prisma/client';
import type { Express } from 'express';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepo: IProductRepository
    ) { }

    // Create Product
    async createProduct(
        sellerId: string,
        dto: CreateProductDto,
        files: Express.Multer.File[],
    ) {
        this.logger.log(`User ${sellerId} is creating a product`);
        
        // Add validation for category and other fields if necessary
        if (!dto.categoryId) {
            this.logger.warn('Category ID is missing for product creation');
            throw new ForbiddenException('Category ID is required');
        }

        // Create the product using the repository
        const product = await this.productRepo.create(sellerId, {
            ...dto,
            images: files, // Files will be passed directly to the product repository
        });

        this.logger.log(`Product ${product.id} created by user ${sellerId}`);
        return product;
    }

    // Get all products, optionally filtered
    async getAllProducts(filter?: FilterProductDto) {
        this.logger.log(`Fetching all products with filter: ${JSON.stringify(filter || {})}`);
        return this.productRepo.findAll(filter || {});
    }

    // Get a specific product by its ID
    async getProductById(id: string) {
        this.logger.log(`Fetching product with ID: ${id}`);
        const product = await this.productRepo.findOne(id);
        
        if (!product) {
            this.logger.warn(`Product not found with ID: ${id}`);
            throw new NotFoundException('Product not found');
        }
        
        return product;
    }

    // Update an existing product
    async updateProduct(
        requesterId: string,
        productId: string,
        dto: UpdateProductDto,
        files?: Express.Multer.File[],
        role?: Role,
    ) {
        this.logger.log(`User ${requesterId} attempting to update product ${productId}`);

        const product = await this.productRepo.findOne(productId);
        if (!product) {
            this.logger.warn(`Product not found with ID: ${productId}`);
            throw new NotFoundException('Product not found');
        }

        // Check if the user is either the product owner or an admin
        const isOwner = product.sellerId === requesterId;
        const isAdmin = role === Role.ADMIN;
        if (!isOwner && !isAdmin) {
            this.logger.warn(
                `Unauthorized update attempt by user ${requesterId} on product ${productId}`,
            );
            throw new ForbiddenException('Access denied');
        }

        // Proceed with the update operation
        const updated = await this.productRepo.update(productId, dto, files);
        this.logger.log(`Product ${productId} updated by user ${requesterId}`);
        return updated;
    }

    // Delete an existing product
    async deleteProduct(
        requesterId: string,
        productId: string,
        role?: Role,
    ) {
        this.logger.log(`User ${requesterId} attempting to delete product ${productId}`);

        const product = await this.productRepo.findOne(productId);
        if (!product) {
            this.logger.warn(`Product not found with ID: ${productId}`);
            throw new NotFoundException('Product not found');
        }

        // Check if the user is either the product owner or an admin
        const isOwner = product.sellerId === requesterId;
        const isAdmin = role === Role.ADMIN;
        if (!isOwner && !isAdmin) {
            this.logger.warn(
                `Unauthorized delete attempt by user ${requesterId} on product ${productId}`,
            );
            throw new ForbiddenException('Access denied');
        }

        // Proceed with the delete operation
        const deleted = await this.productRepo.delete(productId);
        this.logger.log(`Product ${productId} deleted by user ${requesterId}`);
        return deleted;
    }
}
