import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderWithItems, IOrderRepository } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderRepository implements IOrderRepository {
  private readonly logger = new Logger(OrderRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrderWithItems[]> {
    this.logger.debug(`Fetching all orders`);
    try {
      const orders = await this.prisma.order.findMany({
        include: this.defaultIncludes(),
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

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
    this.logger.debug(`Creating order for userId: ${userId}, data: ${JSON.stringify(dto)}`);
    try {
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

      const address = await this.prisma.address.create({
        data: {
          ...dto.address,
          user: { connect: { id: userId } },
        },
      });

      const totalAmount = cart.items.reduce((total, item) => {
        return total + Number(item.product.price) * item.quantity;
      }, 0);

      const order = await this.prisma.order.create({
        data: {
          userId,
          addressId: address.id,
          totalAmount,
          paymentType: dto.paymentType || 'CARD',
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

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    this.logger.debug(`Updating order status for id: ${id}, status: ${status}`);
    try {
      const order = await this.prisma.order.update({
        where: { id },
        data: { status },
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
        data: { deliveryStatus },
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
        data: { status: 'CANCELLED' },
        include: this.defaultIncludes(),
      });
      this.logger.debug(`Order cancelled successfully: ${id}`);
      return this.mapToOrderWithItems(order);
    } catch (error) {
      this.logger.error(`Failed to cancel order with id: ${id}`, error.stack);
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }
  }

  private defaultIncludes(includePayment = true) {
    return {
      items: {
        include: {
          product: {
            select: {
              title: true,
            },
          },
        },
      },
      address: true,
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
        price: Number(item.price),
        quantity: item.quantity,
      })),
    };
  }
}