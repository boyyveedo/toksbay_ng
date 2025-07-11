import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auths/auth.module';
import { UserModule } from './modules/users/users.module';
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
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [() => ({
        FRONTEND_URL: process.env.FRONTEND_URL || 'https://soloshopp.netlify.app',
      })],
    }),
    
    // Rate limiting configuration - Generous global defaults
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 300, // 300 requests per minute (generous for e-commerce browsing)
      }
    ]),
    
    AuthModule,
    UserModule,
    ProductModule,
    CategoryModule,
    CartModule,
    OrderModule,
    PaymentModule,
    ReviewsModule,
    SharedModule,
    PrismaModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttler guard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}