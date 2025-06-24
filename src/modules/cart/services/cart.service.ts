import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CART_REPOSITORY, ICartRepository } from '../interface/cart.interface';
import { AddCartItemDto, UpdateCartItemDto } from '../dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {}

  async getCart(userId: string) {
    this.logger.debug(`Fetching cart for userId: ${userId}`);
    try {
      let cart = await this.cartRepository.findCartWithItems(userId);

      if (!cart) {
        this.logger.debug(`Cart not found for userId: ${userId}, creating new cart`);
        await this.cartRepository.create(userId);
        cart = await this.cartRepository.findCartWithItems(userId);
      }

      this.logger.debug(`Cart retrieved successfully for userId: ${userId}`);
      return cart;
    } catch (error) {
      this.logger.error(`Failed to fetch cart for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    this.logger.debug(`Adding item to cart for userId: ${userId}, item: ${JSON.stringify(dto)}`);
    try {
      const result = await this.cartRepository.addItem(userId, dto);
      this.logger.debug(`Item added successfully for userId: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to add item for userId: ${userId}`, error.stack);
      throw error;
    }
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto) {
    this.logger.debug(`Updating item quantity for userId: ${userId}, itemId: ${itemId}, data: ${JSON.stringify(dto)}`);
    try {
      const cart = await this.cartRepository.findByUserId(userId);
      if (!cart) {
        this.logger.warn(`Cart not found for userId: ${userId}`);
        throw new NotFoundException('Cart not found');
      }

      const item = cart.items.find(item => item.id === itemId);
      if (!item) {
        this.logger.warn(`Item not found in cart for userId: ${userId}, itemId: ${itemId}`);
        throw new NotFoundException('Item not found in cart');
      }

      const result = await this.cartRepository.updateItemQuantity(userId, itemId, dto);
      this.logger.debug(`Item quantity updated successfully for userId: ${userId}, itemId: ${itemId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update item quantity for userId: ${userId}, itemId: ${itemId}`, error.stack);
      throw error;
    }
  }

  async removeItem(userId: string, itemId: string) {
    this.logger.debug(`Removing item from cart for userId: ${userId}, itemId: ${itemId}`);
    try {
      const result = await this.cartRepository.removeItem(userId, itemId);
      this.logger.debug(`Item removed successfully for userId: ${userId}, itemId: ${itemId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to remove item for userId: ${userId}, itemId: ${itemId}`, error.stack);
      throw new NotFoundException(`Item with ID ${itemId} not found in cart`);
    }
  }

  async clearCart(userId: string) {
    this.logger.debug(`Clearing cart for userId: ${userId}`);
    try {
      const result = await this.cartRepository.clearCart(userId);
      this.logger.debug(`Cart cleared successfully for userId: ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to clear cart for userId: ${userId}`, error.stack);
      throw error;
    }
  }
}