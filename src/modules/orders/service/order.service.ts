
import { Injectable, Inject } from '@nestjs/common';
import { IOrderRepository } from '../interface/order.interface';
import { OrderWithItems } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(
    @Inject('IOrderRepository') 
    private readonly orderRepository: IOrderRepository
  ) {}

  async findAll(): Promise<OrderWithItems[]> {
    return this.orderRepository.findAll();
  }

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    return this.orderRepository.findById(id);
  }

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
    return this.orderRepository.create(userId, dto);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    return this.orderRepository.updateStatus(id, status);
  }

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<OrderWithItems> {
    return this.orderRepository.updateDeliveryStatus(id, deliveryStatus);
  }

  async cancelOrder(id: string): Promise<OrderWithItems> {
    return this.orderRepository.cancelOrder(id);
  }
}
