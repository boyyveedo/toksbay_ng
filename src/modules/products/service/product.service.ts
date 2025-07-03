import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
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
    private readonly productRepo: IProductRepository,
  ) {}

  async createProduct(
    sellerId: string,
    dto: CreateProductDto,
    files: Express.Multer.File[],
  ) {
    this.logger.debug(`Creating product for sellerId: ${sellerId}, data: ${JSON.stringify(dto)}`);
    try {
      if (!dto.categoryId) {
        this.logger.warn(`Category ID is missing for product creation by sellerId: ${sellerId}`);
        throw new HttpException('Category ID is required', HttpStatus.BAD_REQUEST);
      }

      const product = await this.productRepo.create(sellerId, {
        ...dto,
        images: files,
      });

      this.logger.debug(`Product created successfully: ${product.id} by sellerId: ${sellerId}`);
      return product;
    } catch (error) {
      this.logger.error(`Failed to create product for sellerId: ${sellerId}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to create product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllProducts(filter?: FilterProductDto) {
    this.logger.debug(`Fetching all products with filter: ${JSON.stringify(filter || {})}`);
    try {
      const products = await this.productRepo.findAll(filter || {});
      this.logger.debug(`Retrieved ${products.length} products`);
      return products;
    } catch (error) {
      this.logger.error(`Failed to fetch products with filter: ${JSON.stringify(filter || {})}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to fetch products', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProductById(id: string) {
    this.logger.debug(`Fetching product with id: ${id}`);
    try {
      const product = await this.productRepo.findOne(id);
      if (!product) {
        this.logger.warn(`Product not found with id: ${id}`);
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      this.logger.debug(`Product fetched successfully: ${id}`);
      return product;
    } catch (error) {
      this.logger.error(`Failed to fetch product with id: ${id}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to fetch product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProduct(
    requesterId: string,
    productId: string,
    dto: UpdateProductDto,
    files?: Express.Multer.File[],
    role?: Role,
  ) {
    this.logger.debug(`Updating product with id: ${productId} by requesterId: ${requesterId}, data: ${JSON.stringify(dto)}`);
    try {
      const product = await this.productRepo.findOne(productId);
      if (!product) {
        this.logger.warn(`Product not found with id: ${productId}`);
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const isOwner = product.sellerId === requesterId;
      const isAdmin = role === Role.ADMIN;
      if (!isOwner && !isAdmin) {
        this.logger.warn(`Unauthorized update attempt by requesterId: ${requesterId} on product: ${productId}`);
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const updated = await this.productRepo.update(productId, dto, files);
      this.logger.debug(`Product updated successfully: ${productId} by requesterId: ${requesterId}`);
      return updated;
    } catch (error) {
      this.logger.error(`Failed to update product with id: ${productId} by requesterId: ${requesterId}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to update product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteProduct(
    requesterId: string,
    productId: string,
    role?: Role,
  ) {
    this.logger.debug(`Deleting product with id: ${productId} by requesterId: ${requesterId}`);
    try {
      const product = await this.productRepo.findOne(productId);
      if (!product) {
        this.logger.warn(`Product not found with id: ${productId}`);
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      const isOwner = product.sellerId === requesterId;
      const isAdmin = role === Role.ADMIN;
      if (!isOwner && !isAdmin) {
        this.logger.warn(`Unauthorized delete attempt by requesterId: ${requesterId} on product: ${productId}`);
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }

      const deleted = await this.productRepo.delete(productId);
      this.logger.debug(`Product deleted successfully: ${productId} by requesterId: ${requesterId}`);
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete product with id: ${productId} by requesterId: ${requesterId}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to delete product', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}