import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CartWithItems, ICartRepository } from '../interface/cart.interface';
import { AddCartItemDto, UpdateCartItemDto } from '../dto';

@Injectable()
export class CartRepository implements ICartRepository {
  private readonly logger = new Logger(CartRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<CartWithItems | null> {
    this.logger.debug(`Finding cart by userId: ${userId}`);
    try {
      const cart = await this.prisma.cart.findFirst({
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
      this.logger.debug(`Cart ${cart ? 'found' : 'not found'} for userId: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error(`Failed to find cart for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async findCartWithItems(userId: string): Promise<CartWithItems | null> {
    this.logger.debug(`Fetching cart with items for userId: ${userId}`);
    try {
      return await this.findByUserId(userId);
    } catch (error) {
      this.logger.error(`Failed to fetch cart with items for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async create(userId: string): Promise<CartWithItems> {
    this.logger.debug(`Creating cart for userId: ${userId}`);
    try {
      const cart = await this.prisma.cart.create({ data: { userId } });
      this.logger.debug(`Cart created successfully for userId: ${userId}`);
      return cart as CartWithItems;
    } catch (error) {
      this.logger.error(`Failed to create cart for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartWithItems> {
    this.logger.debug(`Adding item to cart for userId: ${userId}, item: ${JSON.stringify(dto)}`);
    try {
      let cart = await this.prisma.cart.findFirst({ where: { userId } });

      if (!cart) {
        this.logger.debug(`Cart not found for userId: ${userId}, creating new cart`);
        cart = await this.create(userId);
      }

      const existingItem = await this.prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: dto.productId,
        },
      });

      if (existingItem) {
        this.logger.debug(`Updating existing item for cartId: ${cart.id}, productId: ${dto.productId}`);
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + dto.quantity },
        });
      } else {
        this.logger.debug(`Creating new item for cartId: ${cart.id}, productId: ${dto.productId}`);
        await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: dto.productId,
            quantity: dto.quantity,
          },
        });
      }

      const updatedCart = await this.findCartWithItems(userId);
      if (!updatedCart) {
        throw new Error('Failed to retrieve updated cart');
      }
      this.logger.debug(`Item added successfully for userId: ${userId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Failed to add item for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartWithItems> {
    this.logger.debug(`Updating item quantity for userId: ${userId}, itemId: ${itemId}, data: ${JSON.stringify(dto)}`);
    try {
      const cart = await this.prisma.cart.findFirst({ where: { userId } });

      if (!cart) {
        this.logger.warn(`Cart not found for userId: ${userId}`);
        throw new NotFoundException('Cart not found');
      }

      await this.prisma.cartItem.update({
        where: {
          id: itemId,
          cartId: cart.id,
        },
        data: { quantity: dto.quantity },
      });

      const updatedCart = await this.findCartWithItems(userId);
      if (!updatedCart) {
        throw new Error('Failed to retrieve updated cart');
      }
      this.logger.debug(`Item quantity updated for userId: ${userId}, itemId: ${itemId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Failed to update item quantity for userId: ${userId}, itemId: ${itemId}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Item not found in cart');
    }
  }

  async removeItem(userId: string, itemId: string): Promise<CartWithItems> {
    this.logger.debug(`Removing item from cart for userId: ${userId}, itemId: ${itemId}`);
    try {
      const cart = await this.prisma.cart.findFirst({ where: { userId } });

      if (!cart) {
        this.logger.warn(`Cart not found for userId: ${userId}`);
        throw new NotFoundException('Cart not found');
      }

      await this.prisma.cartItem.delete({
        where: {
          id: itemId,
          cartId: cart.id,
        },
      });

      const updatedCart = await this.findCartWithItems(userId);
      if (!updatedCart) {
        throw new Error('Failed to retrieve updated cart');
      }
      this.logger.debug(`Item removed successfully for userId: ${userId}, itemId: ${itemId}`);
      return updatedCart;
    } catch (error) {
      this.logger.error(`Failed to remove item for userId: ${userId}, itemId: ${itemId}`, error.stack);
      throw new NotFoundException(`Item with ID ${itemId} not found in cart`);
    }
  }

  async clearCart(userId: string): Promise<void> {
    this.logger.debug(`Clearing cart for userId: ${userId}`);
    try {
      const cart = await this.prisma.cart.findFirst({ where: { userId } });

      if (!cart) {
        this.logger.debug(`No cart found to clear for userId: ${userId}`);
        return;
      }

      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      this.logger.debug(`Cart cleared successfully for userId: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to clear cart for userId: ${userId}`, error.stack);
      throw error;
    }
  }
}