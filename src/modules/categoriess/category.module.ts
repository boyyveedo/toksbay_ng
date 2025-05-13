// category.module.ts
import { Module } from '@nestjs/common';
import { CategoryController } from './controller/category.controller';
import { CategoryService } from './services/category.services';
import { CategoryRepository } from './repository/category.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { CATEGORY_REPOSITORY } from './dto/interface/category.interface';
import { AuthModule } from '../auth /auth.module';

@Module({
    imports: [AuthModule],
    controllers: [CategoryController],
    providers: [
        CategoryService,
        PrismaService,
        {
            provide: CATEGORY_REPOSITORY,
            useClass: CategoryRepository,
        },
    ],
})
export class CategoryModule { }
