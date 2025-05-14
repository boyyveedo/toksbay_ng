
import { Controller, Get, Param, Post, Body, Put, Delete, HttpCode, HttpStatus , NotFoundException} from '@nestjs/common';
import { OrderService } from '../service/order.service';
import { CreateOrderDto } from '../dto';
import { OrderWithItems } from '../interface/order.interface';
import { OrderStatus, DeliveryStatus } from '@prisma/client';

@Controller('api/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async findAll(): Promise<OrderWithItems[]> {
    return this.orderService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<OrderWithItems> {
    const order = await this.orderService.findById(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED) 
  async create(@Body() createOrderDto: CreateOrderDto): Promise<OrderWithItems> {
    return this.orderService.create(createOrderDto.userId, createOrderDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateStatus(id, status);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Put(':id/delivery-status')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body('deliveryStatus') deliveryStatus: DeliveryStatus
  ): Promise<OrderWithItems> {
    const order = await this.orderService.updateDeliveryStatus(id, deliveryStatus);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  @Delete(':id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT) 
  async cancelOrder(@Param('id') id: string): Promise<void> {
    const order = await this.orderService.cancelOrder(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
