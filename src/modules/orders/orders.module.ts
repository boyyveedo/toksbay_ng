
import { Module } from '@nestjs/common';
import { OrderService } from './service/order.service';
import { OrderRepository } from './repository/order.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderController } from './controller/order.controller';

@Module({
  providers: [ OrderService, OrderRepository,
    PrismaService,
    {
      provide: 'IOrderRepository', 
      useClass: OrderRepository,   
    },
    OrderService,
  ],
  exports: [OrderService], 
  controllers: [OrderController] 
})
export class OrderModule {}
