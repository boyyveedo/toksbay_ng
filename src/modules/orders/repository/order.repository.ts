import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderWithItems, IOrderRepository } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderRepository implements IOrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  // =============================================
  // BASIC CRUD OPERATIONS
  // =============================================

  async findAll(): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching all orders`);
    try {
      const orders = await this.prisma.order.findMany({
        include: this.defaultIncludes(),
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`Retrieved ${orders.length} orders`);
      return orders.map(this.mapToOrderWithItems);
    } catch (error) {
      this.logger.error(`Failed to fetch all orders`, error.stack);
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching orders for userId: ${userId}`);
    try {
      const orders = await this.prisma.order.findMany({
        where: { userId },
        include: this.defaultIncludes(),
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`Retrieved ${orders.length} orders for userId: ${userId}`);
      return orders.map(this.mapToOrderWithItems);
    } catch (error) {
      this.logger.error(`Failed to fetch orders for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    this.logger.debug(`Fetching order with id: ${id}`);
    try {
      const order = await this.prisma.order.findUnique({
        where: { id },
        include: this.defaultIncludes(),
      });
      this.logger.debug(`Order ${order ? 'found' : 'not found'} for id: ${id}`);
      return order ? this.mapToOrderWithItems(order) : null;
    } catch (error) {
      this.logger.error(`Failed to fetch order with id: ${id}`, error.stack);
      throw error;
    }
  }

  async findByIdAndUserId(orderId: string, userId: string): Promise<OrderWithItems | null> {
    this.logger.debug(`Fetching order ${orderId} for user ${userId}`);
    try {
      const order = await this.prisma.order.findFirst({
        where: { 
          id: orderId,
          userId: userId 
        },
        include: this.defaultIncludes(),
      });
      
      if (!order) {
        this.logger.debug(`Order ${orderId} not found for user ${userId}`);
        return null;
      }
      
      this.logger.debug(`Order ${orderId} found for user ${userId}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to fetch order ${orderId} for user ${userId}`, error.stack);
      throw error;
    }
  }

  // =============================================
  // ORDER CREATION
  // =============================================

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
    this.logger.debug(`Creating order for userId: ${userId}, data: ${JSON.stringify(dto)}`);
    try {
      // Fetch user's cart with items
      const cart = await this.prisma.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        this.logger.warn(`Cart is empty for userId: ${userId}`);
        throw new HttpException('Cart is empty. Cannot place order.', HttpStatus.BAD_REQUEST);
      }

      // Create delivery address
      const address = await this.prisma.address.create({
        data: {
          ...dto.address,
          user: { connect: { id: userId } },
        },
      });

      // Calculate total amount
      const totalAmount = cart.items.reduce((total, item) => {
        return total + Number(item.product.price) * item.quantity;
      }, 0);

      // Create order with items
      const order = await this.prisma.order.create({
        data: {
          userId,
          addressId: address.id,
          totalAmount,
          paymentType: dto.paymentType || 'CARD',
          status: 'PENDING',
          deliveryStatus:'PENDING',
          items: {
            create: cart.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: this.defaultIncludes(false),
      });

      // Clear user's cart after successful order
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      this.logger.debug(`Order created successfully: ${order.id} for userId: ${userId}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to create order for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  // =============================================
  // ORDER STATUS MANAGEMENT
  // =============================================

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    this.logger.debug(`Updating order status for id: ${id}, status: ${status}`);
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { 
          status,
          updatedAt: new Date(),
        },
        include: this.defaultIncludes(),
      });
      this.logger.debug(`Order status updated successfully: ${id}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to update order status for id: ${id}`, error.stack);
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
  }

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<OrderWithItems> {
    this.logger.debug(`Updating delivery status for order id: ${id}, deliveryStatus: ${deliveryStatus}`);
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { 
          deliveryStatus,
          updatedAt: new Date(),
        },
        include: this.defaultIncludes(),
      });
      this.logger.debug(`Delivery status updated successfully: ${id}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to update delivery status for id: ${id}`, error.stack);
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
  }

  async cancelOrder(id: string): Promise<OrderWithItems> {
    this.logger.debug(`Cancelling order with id: ${id}`);
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { 
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
        include: this.defaultIncludes(),
      });
      this.logger.debug(`Order cancelled successfully: ${id}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to cancel order with id: ${id}`, error.stack);
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
  }

  // =============================================
  // VALIDATION AND BUSINESS LOGIC HELPERS
  // =============================================

  async canCancelOrder(orderId: string, userId: string): Promise<{ canCancel: boolean, reason?: string }> {
    this.logger.debug(`Checking if order ${orderId} can be cancelled by user ${userId}`);
    
    try {
      const order = await this.findByIdAndUserId(orderId, userId);
      
      if (!order) {
        return { canCancel: false, reason: 'Order not found' };
      }

      // Business rules for cancellation
      const nonCancellableStatuses = ['DELIVERED', 'CANCELLED', 'SHIPPED'];
      
      if (nonCancellableStatuses.includes(order.status)) {
        return { 
          canCancel: false, 
          reason: `Cannot cancel ${order.status.toLowerCase()} orders` 
        };
      }

      return { canCancel: true };
    } catch (error) {
      this.logger.error(`Failed to check cancellation status for order ${orderId}`, error.stack);
      return { canCancel: false, reason: 'Error checking order status' };
    }
  }

  async getOrdersByStatus(status: OrderStatus): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching orders with status: ${status}`);
    try {
      const orders = await this.prisma.order.findMany({
        where: { status },
        include: this.defaultIncludes(),
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`Retrieved ${orders.length} orders with status: ${status}`);
      return orders.map(this.mapToOrderWithItems);
    } catch (error) {
      this.logger.error(`Failed to fetch orders with status: ${status}`, error.stack);
      throw error;
    }
  }

  async getOrdersByDeliveryStatus(deliveryStatus: DeliveryStatus): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching orders with delivery status: ${deliveryStatus}`);
    try {
      const orders = await this.prisma.order.findMany({
        where: { deliveryStatus },
        include: this.defaultIncludes(),
        orderBy: { createdAt: 'desc' },
      });
      this.logger.debug(`Retrieved ${orders.length} orders with delivery status: ${deliveryStatus}`);
      return orders.map(this.mapToOrderWithItems);
    } catch (error) {
      this.logger.error(`Failed to fetch orders with delivery status: ${deliveryStatus}`, error.stack);
      throw error;
    }
  }

  // =============================================
  // STATISTICS AND REPORTING
  // =============================================

  async getUserOrderStats(userId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalSpent: number;
  }> {
    this.logger.debug(`Fetching order statistics for user: ${userId}`);
    try {
      const [orders, orderStats] = await Promise.all([
        this.prisma.order.findMany({
          where: { userId },
          select: { status: true, totalAmount: true },
        }),
        this.prisma.order.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true },
          _sum: { totalAmount: true },
        }),
      ]);

      const stats = {
        totalOrders: orders.length,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0,
      };

      orderStats.forEach(stat => {
        const count = stat._count.status;
        const amount = Number(stat._sum.totalAmount || 0);
        
        switch (stat.status) {
          case 'PENDING':
          case 'PROCESSING':
          case 'SHIPPED':
            stats.pendingOrders += count;
            break;
          case 'DELIVERED':
            stats.completedOrders += count;
            stats.totalSpent += amount;
            break;
          case 'CANCELLED':
            stats.cancelledOrders += count;
            break;
        }
      });

      this.logger.debug(`Order statistics calculated for user: ${userId}`);
      return stats;
    } catch (error) {
      this.logger.error(`Failed to fetch order statistics for user: ${userId}`, error.stack);
      throw error;
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private defaultIncludes(includePayment = true) {
    return {
      items: {
        include: {
          product: {
            select: {
              id: true,
              title: true,
              description: true,
              images: true,
            },
          },
        },
      },
      address: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      ...(includePayment ? { payment: true } : {}),
    };
  }

  private mapToOrderWithItems(order: any): OrderWithItems {
    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.title,
        description: item.product.description,
        imageUrl: item.product.imageUrl,
        price: Number(item.price),
        quantity: item.quantity,
        subtotal: Number(item.price) * item.quantity,
      })),
      user: order.user ? {
        id: order.user.id,
        email: order.user.email,
        fullName: `${order.user.firstName} ${order.user.lastName}`.trim(),
      } : undefined,
    };
  }
}