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
    Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductService } from '../service/product.service';
import { CreateProductDto, UpdateProductDto, FilterProductDto } from '../dto';
import { Roles } from 'src/common/decorators';
import { Role } from '@prisma/client';
import { RolesGuard } from 'src/common/guards';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/common/decorators';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiConsumes,
    ApiBody,
    ApiParam,
    ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post('create')
    @Roles(Role.ADMIN, Role.CUSTOMER)
    @UseInterceptors(FilesInterceptor('images', 5))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Create a new product' })
    @ApiResponse({ status: 201, description: 'Product successfully created' })
    @ApiBody({ type: CreateProductDto })
    
    createProduct(
        @GetUser('id') sellerId: string,
        @Body() dto: CreateProductDto,
        @UploadedFiles() files: Express.Multer.File[],
    ) {
        return this.productService.createProduct(sellerId, dto, files);
    }

    @Get()
    @ApiOperation({ summary: 'Get all products (with optional filters)' })
    @ApiQuery({ name: 'search', required: false })
    @ApiQuery({ name: 'categoryId', required: false })
    @ApiQuery({ name: 'condition', required: false, enum: ['NEW', 'USED'] })
    @ApiQuery({ name: 'limit', required: false })
    @ApiQuery({ name: 'offset', required: false })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'price'] })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    getAll(@Query() filterDto: FilterProductDto) {
        return this.productService.getAllProducts(filterDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product by ID' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    getOne(@Param('id') id: string) {
        return this.productService.getProductById(id);
    }

    @Put(':id/edit')
    @Roles(Role.ADMIN, Role.CUSTOMER)
    @ApiOperation({ summary: 'Update a product (Admin/Customer)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    @ApiBody({ type: UpdateProductDto })
    updateProduct(
        @GetUser('id') sellerId: string,
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.updateProduct(sellerId, id, dto);
    }

    @Delete(':id')
    @Roles(Role.ADMIN, Role.CUSTOMER)
    @ApiOperation({ summary: 'Delete a product (Admin/Customer)' })
    @ApiParam({ name: 'id', description: 'Product ID' })
    deleteProduct(
        @GetUser('id') sellerId: string,
        @Param('id') id: string,
    ) {
        return this.productService.deleteProduct(sellerId, id);
    }
}
