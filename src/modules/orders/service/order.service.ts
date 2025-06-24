import { Injectable, Inject, Logger } from '@nestjs/common';
import { IOrderRepository, OrderWithItems } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async findAll(): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching all orders`);
    try {
      const orders = await this.orderRepository.findAll();
      this.logger.debug(`Retrieved ${orders.length} orders`);
      return orders;
    } catch (error) {
      this.logger.error(`Failed to fetch all orders`, error.stack);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching orders for userId: ${userId}`);
    try {
      const orders = await this.orderRepository.findByUserId(userId);
      this.logger.debug(`Retrieved ${orders.length} orders for userId: ${userId}`);
      return orders;
    } catch (error) {
      this.logger.error(`Failed to fetch orders for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    this.logger.debug(`Fetching order with id: ${id}`);
    try {
      const order = await this.orderRepository.findById(id);
      this.logger.debug(`Order ${order ? 'found' : 'not found'} for id: ${id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to fetch order with id: ${id}`, error.stack);
      throw error;
    }
  }

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
    this.logger.debug(`Creating order for userId: ${userId}, data: ${JSON.stringify(dto)}`);
    try {
      const order = await this.orderRepository.create(userId, dto);
      this.logger.debug(`Order created successfully: ${order.id} for userId: ${userId}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to create order for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    this.logger.debug(`Updating order status for id: ${id}, status: ${status}`);
    try {
      const order = await this.orderRepository.updateStatus(id, status);
      this.logger.debug(`Order status updated successfully: ${id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to update order status for id: ${id}`, error.stack);
      throw error;
    }
  }

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<OrderWithItems> {
    this.logger.debug(`Updating delivery status for order id: ${id}, deliveryStatus: ${deliveryStatus}`);
    try {
      const order = await this.orderRepository.updateDeliveryStatus(id, deliveryStatus);
      this.logger.debug(`Delivery status updated successfully: ${id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to update delivery status for id: ${id}`, error.stack);
      throw error;
    }
  }

  async cancelOrder(id: string): Promise<OrderWithItems> {
    this.logger.debug(`Cancelling order with id: ${id}`);
    try {
      const order = await this.orderRepository.cancelOrder(id);
      this.logger.debug(`Order cancelled successfully: ${id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to cancel order with id: ${id}`, error.stack);
      throw error;
    }
  }
}