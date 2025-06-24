import { Cart, CartItem, Product } from '@prisma/client';
import { AddCartItemDto, UpdateCartItemDto } from '../dto';

export type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product & {
      images: { id: string; url: string; productId: string }[]
    }
  })[]
};

export const CART_REPOSITORY = 'CART_REPOSITORY';

export interface ICartRepository {
  findByUserId(userId: string): Promise<CartWithItems | null>;
  findCartWithItems(userId: string): Promise<CartWithItems | null>;
  create(userId: string): Promise<Cart>;
  addItem(userId: string, dto: AddCartItemDto): Promise<CartWithItems>;
  updateItemQuantity(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartWithItems>;
  removeItem(userId: string, itemId: string): Promise<CartWithItems>;
  clearCart(userId: string): Promise<void>;
} 