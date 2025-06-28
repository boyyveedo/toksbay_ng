import {
  Controller, Get, Param, Post, Body, Put, Delete,
  HttpCode, HttpStatus, NotFoundException, UseGuards, ForbiddenException
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth
} from '@nestjs/swagger';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto';
import { UpdateDeliveryStatusDto } from '../dto/update-delivery.dto';
import { UpdateOrderStatusDto } from '../dto/update-order.dto';
import { OrderWithItems } from '../interface/order.interface';
import { OrderStatus, DeliveryStatus, Role } from '@prisma/client';
import { JwtAuthGuard, VerifiedUserGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUser } from 'src/common/decorators';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedUserGuard)
@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // =============================================
  // USER ENDPOINTS - For regular users
  // =============================================

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user\'s orders' })
  @ApiResponse({ status: 200, description: 'User orders returned successfully' })
  async getMyOrders(@GetUser('id') userId: string): Promise<OrderWithItems[]> {
    return this.orderService.findByUserId(userId);
  }

  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Get specific order for current user' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not your order' })
  async getMyOrder(
    @Param('id') orderId: string,
    @GetUser('id') userId: string
  ): Promise<OrderWithItems> {
    const order = await this.orderService.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }
    return order;
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new order from cart' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Cart is empty or invalid data' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderWithItems> {
    return this.orderService.create(userId, createOrderDto);
  }

  @Delete('my-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel user\'s own order' })
  @ApiResponse({ status: 204, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Cannot cancel this order' })
  async cancelMyOrder(
    @Param('id') orderId: string,
    @GetUser('id') userId: string,
  ): Promise<OrderWithItems> {
    // Verify user owns the order and it's cancellable
    const order = await this.orderService.findByIdAndUserId(orderId, userId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if order can be cancelled (business logic)
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      throw new ForbiddenException('Cannot cancel delivered or already cancelled orders');
    }

    return await this.orderService.cancelOrder(orderId); 
  }

  // =============================================
  // ADMIN ENDPOINTS - For administrators only
  // =============================================

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: Get all orders in the system' })
  @ApiResponse({ status: 200, description: 'All orders returned' })
  async getAllOrders(): Promise<OrderWithItems[]> {
    return this.orderService.findAll();
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/:id')
  @ApiOperation({ summary: 'Admin: Get any order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') id: string): Promise<OrderWithItems> {
    const order = await this.orderService.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/user/:userId')
  @ApiOperation({ summary: 'Admin: Get all orders for a specific user' })
  @ApiResponse({ status: 200, description: 'User orders returned' })
  async getUserOrders(@Param('userId') userId: string): Promise<OrderWithItems[]> {
    return this.orderService.findByUserId(userId);
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put('admin/:id/status')
  @ApiOperation({ summary: 'Admin: Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateStatus(id, dto.status);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Put('admin/:id/delivery-status')
  @ApiOperation({ summary: 'Admin: Update delivery status' })
  @ApiResponse({ status: 200, description: 'Delivery status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateDeliveryStatus(id, dto.deliveryStatus);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete('admin/:id/cancel')
  @ApiOperation({ summary: 'Admin: Cancel any order' })
  @ApiResponse({ status: 204, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async adminCancelOrder(@Param('id') id: string): Promise<void> {
    const order = await this.orderService.cancelOrder(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  @Get('status/options')
  @ApiOperation({ summary: 'Get available order status options' })
  @ApiResponse({ status: 200, description: 'Order status options returned' })
  async getOrderStatusOptions(): Promise<{ orderStatuses: string[], deliveryStatuses: string[] }> {
    return {
      orderStatuses: Object.values(OrderStatus),
      deliveryStatuses: Object.values(DeliveryStatus)
    };
  }
}