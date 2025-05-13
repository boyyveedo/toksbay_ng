import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './service/product.service';
import { ProductRepository } from './repository/product.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { OwnershipGuard } from 'src/common/guards/ownership.guard';
import { CommonModule } from 'src/common/common.module';
import { PRODUCT_REPOSITORY } from './interface';
@Module({
    imports: [CommonModule],
    controllers: [ProductController],
    providers: [
        ProductService,
        PrismaService,
        OwnershipGuard,
        {
            provide: PRODUCT_REPOSITORY,
            useClass: ProductRepository,
        },
    ],
})
export class ProductModule { }
