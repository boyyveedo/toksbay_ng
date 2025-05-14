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
  findAll(): Promise<OrderWithItems[]>;
  findByUserId(userId: string): Promise<OrderWithItems[]>;
  findById(orderId: string): Promise<OrderWithItems | null>;
  create(userId: string, dto: CreateOrderDto): Promise<OrderWithItems>;
  updateStatus(orderId: string, status: OrderStatus): Promise<OrderWithItems>;
  updateDeliveryStatus(orderId: string, status: DeliveryStatus): Promise<OrderWithItems>;
  cancelOrder(orderId: string): Promise<OrderWithItems>;
}
