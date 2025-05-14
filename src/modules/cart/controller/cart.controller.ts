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
    ParseUUIDPipe
  } from '@nestjs/common';
import { CartService } from '../services/cart.service';
import { AddCartItemDto,UpdateCartItemDto } from '../dto';
import { JwtAuthGuard } from 'src/common/guards';
import { GetUser } from 'src/common/decorators';
  @Controller('api/cart')
  @UseGuards(JwtAuthGuard)
  export class CartController {
    constructor(private readonly cartService: CartService) {}
  
    @Get()
    async getCart(@GetUser('id') userId: string) {
      return this.cartService.getCart(userId);
    }
  
    @Post('items')
    async addItemToCart(
      @GetUser('id') userId: string,
      @Body() dto: AddCartItemDto
    ) {
      return this.cartService.addItem(userId, dto);
    }
  
    @Put('items/:itemId')
    async updateCartItem(
      @GetUser('id') userId: string,
      @Param('itemId', ParseUUIDPipe) itemId: string,
      @Body() dto: UpdateCartItemDto
    ) {
      return this.cartService.updateItemQuantity(userId, itemId, dto);
    }
  
    @Delete('items/:itemId')
    async removeCartItem(
      @GetUser('id') userId: string,
      @Param('itemId', ParseUUIDPipe) itemId: string
    ) {
      return this.cartService.removeItem(userId, itemId);
    }
  
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    async clearCart(@GetUser('id') userId: string): Promise<void> {
      await this.cartService.clearCart(userId);
    }
  }