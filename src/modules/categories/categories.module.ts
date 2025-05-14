import { Module } from '@nestjs/common';
import { CategoryService } from './service/category.service';
import { CategoryRepository } from './repository/category.repository';
import { CategoryController } from './controller/category.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { CATEGORY_REPOSITORY } from './interface/category.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthModule } from '../auth /auth.module';
@Module({
    imports: [AuthModule, PrismaModule, CommonModule],
    controllers: [CategoryController],
    providers: [CategoryService,
        PrismaService,
        {
            provide: CATEGORY_REPOSITORY,
            useClass: CategoryRepository,
        },
    ],
})
export class CategoryModule { }
