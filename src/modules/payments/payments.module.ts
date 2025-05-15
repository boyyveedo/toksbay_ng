import { Module } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { PaymentController } from './controller/payment.controller';
import { PaystackService } from './provider/paystack.service';
import { PaymentRepository } from './repository/payment.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports:[ConfigModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaystackService,
    PaymentRepository,
    PrismaService,
    ConfigService,
  ],
  exports: [PaymentService],
})
export class PaymentModule {}