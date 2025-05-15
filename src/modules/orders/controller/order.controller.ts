import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    NotFoundException,
    UseGuards,
  } from '@nestjs/common';
  
  import { OrderService } from '../service/order.service';
  import { CreateOrderDto } from '../dto';
  import { OrderWithItems } from '../interface/order.interface';
  import { OrderStatus, DeliveryStatus, Role } from '@prisma/client';
  import { JwtAuthGuard } from 'src/common/guards';
import { VerifiedUserGuard } from 'src/common/guards';
import { RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { GetUser } from 'src/common/decorators';  


  @UseGuards(JwtAuthGuard, VerifiedUserGuard, RolesGuard)
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
    async create(
      @GetUser('id') userId: string,
      @Body() createOrderDto: CreateOrderDto,
    ): Promise<OrderWithItems> {
      return this.orderService.create(userId, createOrderDto);
    }
  
    @Roles(Role.ADMIN)
    @Put(':id/status')
    async updateStatus(
      @Param('id') id: string,
      @Body('status') status: OrderStatus,
    ): Promise<OrderWithItems> {
      const order = await this.orderService.updateStatus(id, status);
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      return order;
    }
  
    @Roles(Role.ADMIN)
    @Put(':id/delivery-status')
    async updateDeliveryStatus(
      @Param('id') id: string,
      @Body('deliveryStatus') deliveryStatus: DeliveryStatus,
    ): Promise<OrderWithItems> {
      const order = await this.orderService.updateDeliveryStatus(id, deliveryStatus);
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      return order;
    }
  
    @Delete(':id/cancel')
    @HttpCode(HttpStatus.NO_CONTENT)
    async cancelOrder(
      @Param('id') id: string,
      @GetUser('id') userId: string,
    ): Promise<void> {
  
      const order = await this.orderService.cancelOrder(id);
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
    }
  }
  