import { Order, OrderStatus, DeliveryStatus } from '@prisma/client';
import { CreateOrderDto } from '../dto/create-order.dto';

export type OrderWithItems = Order & {
  items: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
};

export const ORDER_REPOSITORY = 'ORDER_REPOSITORY';

export interface IOrderRepository {
  // Existing methods
  findAll(): Promise<OrderWithItems[]>;
  findByUserId(userId: string): Promise<OrderWithItems[]>;
  findById(orderId: string): Promise<OrderWithItems | null>;
  create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems>;
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderWithItems>;
  updateDeliveryStatus(orderId: string, status: DeliveryStatus): Promise<OrderWithItems>;
  cancelOrder(orderId: string): Promise<OrderWithItems>;
  findByIdAndUserId(orderId: string, userId: string): Promise<OrderWithItems | null>;
  canCancelOrder(orderId: string, userId: string): Promise<{ canCancel: boolean; reason?: string }>;
  getUserOrderStats(userId: string): Promise<any>; 
  getOrdersByStatus(status: OrderStatus): Promise<OrderWithItems[]>;
  getOrdersByDeliveryStatus(deliveryStatus: DeliveryStatus): Promise<OrderWithItems[]>;
}