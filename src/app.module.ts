import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth /auth.module';
import { UserModule } from './modules/users /users.module';
import { ProductModule } from './modules/products/products.module';
import { CategoryModule } from './modules/categories/categories.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/orders/orders.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SharedModule } from './modules/shared/shared.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { PaymentModule } from './modules/payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,

    }),
    AuthModule, UserModule, ProductModule, CategoryModule, CartModule, OrderModule, PaymentModule, ReviewsModule, SharedModule, PrismaModule, CommonModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
