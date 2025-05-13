import { Module } from '@nestjs/common';
import { CategoryService } from './service/category.service';
import { CategoryRepository } from './repository/category.repository';
import { CategoryController } from './controller/category.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { CATEGORY_REPOSITORY } from './interface/category.interface';
@Module({
    imports: [PrismaModule, CommonModule],
    controllers: [CategoryController],
    providers: [CategoryService,
        {
            provide: CATEGORY_REPOSITORY,
            useClass: CategoryRepository,
        },
    ],
    exports: [CategoryService]
})
export class CategoryModule { }
