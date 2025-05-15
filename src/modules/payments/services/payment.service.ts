import { Injectable, Logger } from '@nestjs/common';
import { PaymentRepository } from '../repository/payment.repository';
import { PaystackService } from '../provider/paystack.service';
import { InitializePaymentDto } from '../dto/initialize-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { PaymentInitializeResponse, PaymentVerifyResponse } from '../interfaces/payment.interface';
import { OrderStatus, PaymentType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private paymentRepository: PaymentRepository,
    private paystackService: PaystackService,
    private prisma: PrismaService,
  ) {}

  async initializePayment(userId: string, orderId: string, dto: InitializePaymentDto): Promise<PaymentInitializeResponse> {
    // Check if order exists and belongs to user
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, userId },
      include: { user: true },
    });

    if (!order) {
      throw new Error('Order not found or does not belong to user');
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findPaymentByOrderId(orderId);
    if (existingPayment) {
      throw new Error('Payment already initialized for this order');
    }

    // Initialize payment with Paystack
    const paymentData = {
      email: dto.email,
      amount: order.totalAmount.toNumber(),
      metadata: {
        userId,
        orderId,
      },
    };

    const paymentResponse = await this.paystackService.initializePayment(paymentData);

    // Create payment record in database
    await this.paymentRepository.createPayment({
      user: { connect: { id: userId } },
      order: { connect: { id: orderId } },
      amount: order.totalAmount,
      status: 'pending',
      paymentType: PaymentType.CARD,
      reference: paymentResponse.reference // 💥 This is the fix 

    });

    return paymentResponse;
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<PaymentVerifyResponse> {
    // Verify payment with Paystack
    const verificationResponse = await this.paystackService.verifyPayment(dto.reference);

    if (verificationResponse.data.status === 'success') {
      const { metadata } = verificationResponse.data;

      // Update payment status
      await this.paymentRepository.updatePaymentStatus(
        dto.reference,
        'success',
      );

      // Update order status
      await this.prisma.order.update({
        where: { id: metadata.orderId },
        data: { 
          status: 'PROCESSING',
          payment: {
            update: {
              status: 'success',
            },
          },
        },
      });
    }

    return verificationResponse;
  }

  async handleWebhook(payload: any): Promise<void> {
    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      const { reference, metadata } = data;

      // Update payment status
      await this.paymentRepository.updatePaymentStatus(
        reference,
        'success',
      );

      // Update order status
      await this.prisma.order.update({
        where: { id: metadata.orderId },
        data: { 
          status: 'PROCESSING',
          payment: {
            update: {
              status: 'success',
            },
          },
        },
      });
    }
  }
}