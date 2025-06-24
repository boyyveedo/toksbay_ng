import {
    Injectable,
    HttpException,
    HttpStatus,
    Logger,
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
    private readonly logger = new Logger(ProductRepository.name);
  
    constructor(
      private readonly prisma: PrismaService,
      private readonly cloudinaryService: CloudinaryService,
    ) {}
  
    private async uploadImages(files: Express.Multer.File[], productId: string) {
      this.logger.debug(`Uploading ${files.length} images for productId: ${productId}`);
      try {
        const uploadedImages = await Promise.all(
          files.map(async (file) => {
            const url = await this.cloudinaryService.uploadImage(
              file.buffer,
              `${productId}-${Date.now()}`,
            );
            const image = await this.prisma.productImage.create({
              data: { url, productId },
            });
            return image;
          }),
        );
        this.logger.debug(`Uploaded ${uploadedImages.length} images for productId: ${productId}`);
        return uploadedImages;
      } catch (error) {
        this.logger.error(`Failed to upload images for productId: ${productId}`, error.stack);
        throw new HttpException('Failed to upload images', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async create(
      sellerId: string,
      dto: CreateProductDto,
    ): Promise<ProductWithImages> {
      this.logger.debug(`Creating product for sellerId: ${sellerId}, data: ${JSON.stringify(dto)}`);
      try {
        const { images, categoryId, ...productData } = dto;
  
        const category = await this.prisma.category.findUnique({
          where: { id: categoryId },
        });
  
        if (!category) {
          this.logger.warn(`Invalid categoryId: ${categoryId}`);
          throw new HttpException('Invalid category ID', HttpStatus.BAD_REQUEST);
        }
  
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
  
        if (!result) {
          this.logger.error(`Product creation failed for id: ${product.id}`);
          throw new HttpException('Product creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
        }
  
        this.logger.debug(`Product created successfully: ${result.id}`);
        return result;
      } catch (error) {
        this.logger.error(`Failed to create product for sellerId: ${sellerId}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to create product', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async findAll(filter: FilterProductDto): Promise<ProductWithImages[]> {
      this.logger.debug(`Fetching products with filter: ${JSON.stringify(filter)}`);
      try {
        const {
          search,
          categoryId,
          condition,
          limit = 20,
          offset = 0,
          sortBy = 'createdAt',
          sortOrder = 'desc',
        } = filter;
  
        const products = await this.prisma.product.findMany({
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
  
        this.logger.debug(`Retrieved ${products.length} products`);
        return products;
      } catch (error) {
        this.logger.error(`Failed to fetch products with filter: ${JSON.stringify(filter)}`, error.stack);
        throw new HttpException('Failed to fetch products', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async findOne(id: string): Promise<ProductWithImages | null> {
      this.logger.debug(`Fetching product with id: ${id}`);
      try {
        const product = await this.prisma.product.findUnique({
          where: { id },
          include: { images: true },
        });
        this.logger.debug(`Product ${product ? 'found' : 'not found'} for id: ${id}`);
        return product;
      } catch (error) {
        this.logger.error(`Failed to fetch product with id: ${id}`, error.stack);
        throw new HttpException('Failed to fetch product', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async update(
      productId: string,
      dto: UpdateProductDto,
      files?: Express.Multer.File[],
    ): Promise<ProductWithImages> {
      this.logger.debug(`Updating product with id: ${productId}, data: ${JSON.stringify(dto)}`);
      try {
        const { images, categoryId, ...updateData } = dto;
  
        if (categoryId) {
          const category = await this.prisma.category.findUnique({
            where: { id: categoryId },
          });
          if (!category) {
            this.logger.warn(`Invalid categoryId: ${categoryId}`);
            throw new HttpException('Invalid category ID', HttpStatus.BAD_REQUEST);
          }
        }
  
        const productExists = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        if (!productExists) {
          this.logger.warn(`Product not found for id: ${productId}`);
          throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
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
  
        if (!result) {
          this.logger.error(`Updated product not found for id: ${productId}`);
          throw new HttpException('Updated product not found', HttpStatus.INTERNAL_SERVER_ERROR);
        }
  
        this.logger.debug(`Product updated successfully: ${result.id}`);
        return result;
      } catch (error) {
        this.logger.error(`Failed to update product with id: ${productId}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to update product', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async delete(id: string): Promise<Product> {
      this.logger.debug(`Deleting product with id: ${id}`);
      try {
        const product = await this.prisma.product.findUnique({
          where: { id },
        });
        if (!product) {
          this.logger.warn(`Product not found for id: ${id}`);
          throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
        }
  
        const deletedProduct = await this.prisma.product.delete({
          where: { id },
        });
        this.logger.debug(`Product deleted successfully: ${id}`);
        return deletedProduct;
      } catch (error) {
        this.logger.error(`Failed to delete product with id: ${id}`, error.stack);
        throw error instanceof HttpException
          ? error
          : new HttpException('Failed to delete product', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }