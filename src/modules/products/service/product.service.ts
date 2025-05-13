import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    Logger,
    Inject
} from '@nestjs/common';
import { CreateProductDto, FilterProductDto, UpdateProductDto } from '../dto';
import { PRODUCT_REPOSITORY, IProductRepository } from '../interface';
import { Role } from '@prisma/client';
import { Product } from '@prisma/client';

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @Inject(PRODUCT_REPOSITORY)
        private readonly productRepo: IProductRepository
    ) { }

    async createProduct(
        sellerId: string,
        dto: CreateProductDto,
        files: Express.Multer.File[],
    ) {
        this.logger.log(`User ${sellerId} is creating a product`);
        const product = await this.productRepo.create(sellerId, {
            ...dto,
            images: files,
        });
        this.logger.log(`Product ${product.id} created by user ${sellerId}`);
        return product;
    }

    async getAllProducts(filter?: FilterProductDto) {
        this.logger.log(`Fetching all products with filter: ${JSON.stringify(filter || {})}`);
        return this.productRepo.findAll(filter || {});
    }

    async getProductById(id: string) {
        this.logger.log(`Fetching product with ID: ${id}`);
        const product = await this.productRepo.findOne(id);
        if (!product) {
            this.logger.warn(`Product not found with ID: ${id}`);
            throw new NotFoundException('Product not found');
        }
        return product;
    }

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

        const isOwner = product.sellerId === requesterId;
        const isAdmin = role === Role.ADMIN;

        if (!isOwner && !isAdmin) {
            this.logger.warn(
                `Unauthorized update attempt by user ${requesterId} on product ${productId}`,
            );
            throw new ForbiddenException('Access denied');
        }

        const updated = await this.productRepo.update(productId, dto, files);
        this.logger.log(`Product ${productId} updated by user ${requesterId}`);
        return updated;
    }

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

        const isOwner = product.sellerId === requesterId;
        const isAdmin = role === Role.ADMIN;

        if (!isOwner && !isAdmin) {
            this.logger.warn(
                `Unauthorized delete attempt by user ${requesterId} on product ${productId}`,
            );
            throw new ForbiddenException('Access denied');
        }

        const deleted = await this.productRepo.delete(productId);
        this.logger.log(`Product ${productId} deleted by user ${requesterId}`);
        return deleted;
    }
}
