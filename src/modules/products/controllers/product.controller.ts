import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Body,
    Param,
    UploadedFiles,
    UseInterceptors,
    UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from '../service/product.service';
import { CreateProductDto, UpdateProductDto, } from '../dto';
import { Roles } from 'src/common/decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators';


@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductController {
    constructor(private readonly productService: ProductService) { }

    @Post()
    @Roles(Role.ADMIN, Role.CUSTOMER)
    @UseInterceptors(FilesInterceptor('images', 5))
    createProduct(
        @GetUser('id') sellerId: string,
        @Body() dto: CreateProductDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.productService.createProduct(sellerId, dto, files);
    }

    @Get()
    getAll() {
        return this.productService.getAllProducts();
    }

    @Get(':id')
    getOne(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }

    @Put(':id')
    @Roles(Role.ADMIN, Role.CUSTOMER)
    updateProduct(
        @GetUser('id') sellerId: string,
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.updateProduct(sellerId, id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.CUSTOMER)
    deleteProduct(
        @GetUser('id') sellerId: string,
        @Param('id') id: string,
    ) {
        return this.productService.deleteProduct(sellerId, id);
    }
}
