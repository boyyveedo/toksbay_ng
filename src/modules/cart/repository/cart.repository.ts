import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartWithItems, ICartRepository } from '../interface/cart.interface';
import { AddCartItemDto, UpdateCartItemDto } from '../dto';

@Injectable()
export class CartRepository implements ICartRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CartWithItems | null> {
    return this.prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: { images: true },
            },
          },
        },
      },
    });
  }

  async findCartWithItems(userId: string): Promise<CartWithItems | null> {
    return this.findByUserId(userId);
  }

  async create(userId: string) {
    return this.prisma.cart.create({ data: { userId } });
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartWithItems> {
    let cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) {
      cart = await this.create(userId);
    }

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
      },
    });

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          quantity: dto.quantity,
        },
      });
    }

    return this.findCartWithItems(userId) as Promise<CartWithItems>;
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto
  ): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) throw new Error('Cart not found');

    await this.prisma.cartItem.update({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      data: { quantity: dto.quantity },
    });

    return this.findCartWithItems(userId) as Promise<CartWithItems>;
  }

  async removeItem(userId: string, itemId: string): Promise<CartWithItems> {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) throw new Error('Cart not found');

    await this.prisma.cartItem.delete({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    return this.findCartWithItems(userId) as Promise<CartWithItems>;
  }

  async clearCart(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findFirst({ where: { userId } });

    if (!cart) return;

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
