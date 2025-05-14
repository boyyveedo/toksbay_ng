import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CART_REPOSITORY, ICartRepository } from '../interface/cart.interface';
import { AddCartItemDto, UpdateCartItemDto } from '../dto';

@Injectable()
export class CartService {
  constructor(
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
  ) {}

  async getCart(userId: string) {
    let cart = await this.cartRepository.findCartWithItems(userId);
    
    if (!cart) {
      // Create a new cart if one doesn't exist
      await this.cartRepository.create(userId);
      cart = await this.cartRepository.findCartWithItems(userId);
    }
    
    return cart;
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    return this.cartRepository.addItem(userId, dto);
  }

  async updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto) {
    try {
      return await this.cartRepository.updateItemQuantity(userId, itemId, dto);
    } catch (error) {
      throw new NotFoundException(`Item with ID ${itemId} not found in cart`);
    }
  }

  async removeItem(userId: string, itemId: string) {
    try {
      return await this.cartRepository.removeItem(userId, itemId);
    } catch (error) {
      throw new NotFoundException(`Item with ID ${itemId} not found in cart`);
    }
  }

  async clearCart(userId: string) {
    return this.cartRepository.clearCart(userId);
  }
}