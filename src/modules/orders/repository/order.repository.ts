import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderWithItems, IOrderRepository } from '../interface/order.interface';
import { CreateOrderDto } from '../dto';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      include: this.defaultIncludes(),
    });
    return orders.map(this.mapToOrderWithItems);
  }

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: this.defaultIncludes(),
    });
    return orders.map(this.mapToOrderWithItems);
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: this.defaultIncludes(),
    });
    return order ? this.mapToOrderWithItems(order) : null;
  }

  async create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems> {
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

    return this.mapToOrderWithItems(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderWithItems> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: this.defaultIncludes(),
    });
    return this.mapToOrderWithItems(order);
  }

  async updateDeliveryStatus(id: string, deliveryStatus: DeliveryStatus): Promise<OrderWithItems> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { deliveryStatus },
      include: this.defaultIncludes(),
    });
    return this.mapToOrderWithItems(order);
  }

  async cancelOrder(id: string): Promise<OrderWithItems> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: this.defaultIncludes(),
    });
    return this.mapToOrderWithItems(order);
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
