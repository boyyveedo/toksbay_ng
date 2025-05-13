import { Module } from '@nestjs/common';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './service/product.service';
import { ProductRepository } from './repository/product.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CommonModule } from 'src/common/common.module';
import { PRODUCT_REPOSITORY } from './interface/product.interface';
import { AuthModule } from '../auth /auth.module';

@Module({
    imports: [
        CommonModule,
        AuthModule,
    ],
    controllers: [ProductController],
    providers: [
        ProductService,
        PrismaService,
        {
            provide: PRODUCT_REPOSITORY,
            useClass: ProductRepository,
        },
    ],
})
export class ProductModule { }