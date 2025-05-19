import {
  Controller, Get, Param, Post, Body, Put, Delete,
  HttpCode, HttpStatus, NotFoundException, UseGuards
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth
} from '@nestjs/swagger';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto';
import { UpdateDeliveryStatusDto, } from '../dto/update-delivery.dto';
import { UpdateOrderStatusDto } from '../dto/update-order.dto';
import { OrderWithItems } from '../interface/order.interface';
import { OrderStatus, DeliveryStatus, Role } from '@prisma/client';
import { JwtAuthGuard, VerifiedUserGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUser } from 'src/common/decorators';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, VerifiedUserGuard, RolesGuard)
@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponse({ status: 200, description: 'List of orders returned' })
  async findAll(): Promise<OrderWithItems[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('id') id: string): Promise<OrderWithItems> {
    const order = await this.orderService.findById(id);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: string,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<OrderWithItems> {
    return this.orderService.create(userId, createOrderDto);
  }

  @Roles(Role.ADMIN)
  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateStatus(id, dto.status);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  @Roles(Role.ADMIN)
  @Put(':id/delivery-status')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Delivery status updated' })
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateDeliveryStatus(id, dto.status);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
    return order;
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: 204, description: 'Order cancelled successfully' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelOrder(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    const order = await this.orderService.cancelOrder(id);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);
  }
}
