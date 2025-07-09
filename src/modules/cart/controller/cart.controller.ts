import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { CartService } from '../services/cart.service';
import { AddCartItemDto } from '../dto';
import { UpdateCartItemDto } from '../dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Cart')
@UseGuards(JwtAuthGuard)
@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @SkipThrottle() // Allow unlimited cart viewing - essential for UX
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Returns cart items' })
  async getCart(@GetUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post('items')
  @Throttle({ default: { limit: 60, ttl: 60000 } }) // 60 items per minute (1 per second)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - too many items added too quickly' })
  async addItemToCart(
    @GetUser('id') userId: string,
    @Body() dto: AddCartItemDto
  ) {
    return this.cartService.addItem(userId, dto);
  }

  @Put('items/:itemId')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 updates per minute
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item quantity updated' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - too many updates too quickly' })
  async updateCartItem(
    @GetUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto
  ) {
    return this.cartService.updateItemQuantity(userId, itemId, dto);
  }

  @Delete('items/:itemId')
  @Throttle({ default: { limit: 50, ttl: 60000 } }) // 50 deletions per minute
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - too many deletions too quickly' })
  async removeCartItem(
    @GetUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string
  ) {
    return this.cartService.removeItem(userId, itemId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 cart clears per minute
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 204, description: 'Cart cleared' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded - too many cart clears too quickly' })
  async clearCart(@GetUser('id') userId: string): Promise<void> {
    await this.cartService.clearCart(userId);
  }
}