import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { OrderWithItems } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly orderRepository: OrderRepository) {}

  // =============================================
  // USER SERVICE METHODS
  // =============================================

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    this.logger.debug(`Service: Fetching orders for user ${userId}`);
    return this.orderRepository.findByUserId(userId);
  }

  async findByIdAndUserId(orderId: string, userId: string): Promise<OrderWithItems | null> {
    this.logger.debug(`Service: Fetching order ${orderId} for user ${userId}`);
    return this.orderRepository.findByIdAndUserId(orderId, userId);
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<OrderWithItems> {
    this.logger.debug(`Service: Creating order for user ${userId}`);
    return this.orderRepository.create(userId, createOrderDto);
  }

  async cancelOrderByUser(orderId: string, userId: string): Promise<OrderWithItems> {
    this.logger.debug(`Service: User ${userId} attempting to cancel order ${orderId}`);
    
    // Check if user can cancel this order
    const canCancel = await this.orderRepository.canCancelOrder(orderId, userId);
    if (!canCancel.canCancel) {
      throw new ForbiddenException(canCancel.reason || 'Cannot cancel this order');
    }

    return this.orderRepository.cancelOrder(orderId);
  }

  async getUserOrderStats(userId: string) {
    this.logger.debug(`Service: Fetching order statistics for user ${userId}`);
    return this.orderRepository.getUserOrderStats(userId);
  }

  // =============================================
  // ADMIN SERVICE METHODS
  // =============================================

  async findAll(): Promise<OrderWithItems[]> {
    this.logger.debug(`Service: Fetching all orders (admin)`);
    return this.orderRepository.findAll();
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    this.logger.debug(`Service: Fetching order ${id} (admin)`);
    return this.orderRepository.findById(id);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    this.logger.debug(`Service: Updating order ${id} status to ${status} (admin)`);
    return this.orderRepository.updateStatus(id, status);
  }

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<OrderWithItems> {
    this.logger.debug(`Service: Updating order ${id} delivery status to ${deliveryStatus} (admin)`);
    return this.orderRepository.updateDeliveryStatus(id, deliveryStatus);
  }

  async cancelOrder(id: string): Promise<OrderWithItems> {
    this.logger.debug(`Service: Cancelling order ${id} (admin)`);
    return this.orderRepository.cancelOrder(id);
  }

  async getOrdersByStatus(status: OrderStatus): Promise<OrderWithItems[]> {
    this.logger.debug(`Service: Fetching orders with status ${status} (admin)`);
    return this.orderRepository.getOrdersByStatus(status);
  }

  async getOrdersByDeliveryStatus(deliveryStatus: DeliveryStatus): Promise<OrderWithItems[]> {
    this.logger.debug(`Service: Fetching orders with delivery status ${deliveryStatus} (admin)`);
    return this.orderRepository.getOrdersByDeliveryStatus(deliveryStatus);
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  getOrderStatusOptions(): { orderStatuses: string[], deliveryStatuses: string[] } {
    return {
      orderStatuses: Object.values(OrderStatus),
      deliveryStatuses: Object.values(DeliveryStatus)
    };
  }
}