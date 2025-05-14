import { Module } from '@nestjs/common';
import { CartController } from './controller/cart.controller';
import { CartService } from './services/cart.service';
import { CartRepository } from './repository/cart.repository';
import { CART_REPOSITORY } from './interface/cart.interface';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [PrismaModule,CommonModule  ],
  controllers: [CartController],
  providers: [
    CartService,
    {
      provide: CART_REPOSITORY,
      useClass: CartRepository,
    }
  ],
  exports: [CartService],
})
export class CartModule {}