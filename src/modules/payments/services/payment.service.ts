import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
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
    this.logger.debug(`Initializing payment for userId: ${userId}, orderId: ${orderId}, data: ${JSON.stringify(dto)}`);
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId, userId },
        include: { user: true },
      });

      if (!order) {
        this.logger.warn(`Order not found or does not belong to userId: ${userId}, orderId: ${orderId}`);
        throw new HttpException(
          'Order not found or does not belong to user',
          HttpStatus.NOT_FOUND,
        );
      }

      const existingPayment = await this.paymentRepository.findPaymentByOrderId(orderId);
      if (existingPayment) {
        this.logger.warn(`Payment already initialized for orderId: ${orderId}`);
        throw new HttpException(
          'Payment already initialized for this order',
          HttpStatus.BAD_REQUEST,
        );
      }

      const paymentData = {
        email: dto.email,
        amount: order.totalAmount.toNumber(),
        metadata: {
          userId,
          orderId,
        },
      };

      const paymentResponse = await this.paystackService.initializePayment(paymentData);

      await this.paymentRepository.createPayment({
        user: { connect: { id: userId } },
        order: { connect: { id: orderId } },
        amount: order.totalAmount,
        status: 'pending',
        paymentType: PaymentType.CARD,
        reference: paymentResponse.reference,
      });

      this.logger.debug(`Payment initialized successfully for orderId: ${orderId}, reference: ${paymentResponse.reference}`);
      return paymentResponse;
    } catch (error) {
      this.logger.error(`Failed to initialize payment for userId: ${userId}, orderId: ${orderId}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to initialize payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto): Promise<PaymentVerifyResponse> {
    this.logger.debug(`Verifying payment for userId: ${userId}, reference: ${dto.reference}`);
    try {
      if (!dto.reference) {
        this.logger.warn(`Missing reference for payment verification by userId: ${userId}`);
        throw new HttpException('Payment reference is required', HttpStatus.BAD_REQUEST);
      }

      const verificationResponse = await this.paystackService.verifyPayment(dto.reference);

      if (verificationResponse.data.status === 'success') {
        const { metadata } = verificationResponse.data;

        if (!metadata.orderId) {
          this.logger.warn(`Missing orderId in metadata for reference: ${dto.reference}`);
          throw new HttpException('Invalid payment metadata', HttpStatus.BAD_REQUEST);
        }

        await this.paymentRepository.updatePaymentStatusByReference(dto.reference, 'success');

        await this.prisma.order.update({
          where: { id: metadata.orderId },
          data: {
            status: OrderStatus.PROCESSING,
            payment: {
              update: {
                status: 'success',
              },
            },
          },
        });

        this.logger.debug(`Payment verified and order updated successfully for reference: ${dto.reference}, orderId: ${metadata.orderId}`);
      }

      return verificationResponse;
    } catch (error) {
      this.logger.error(`Failed to verify payment for userId: ${userId}, reference: ${dto.reference}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to verify payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async handleWebhook(payload: any): Promise<void> {
    this.logger.debug(`Handling webhook event: ${payload.event}, data: ${JSON.stringify(payload.data)}`);
    try {
      if (!payload.event || !payload.data) {
        this.logger.warn(`Invalid webhook payload: ${JSON.stringify(payload)}`);
        throw new HttpException('Invalid webhook payload', HttpStatus.BAD_REQUEST);
      }

      const event = payload.event;
      const data = payload.data;

      if (event === 'charge.success') {
        const { reference, metadata } = data;

        if (!reference || !metadata.orderId) {
          this.logger.warn(`Missing reference or orderId in webhook data: ${JSON.stringify(data)}`);
          throw new HttpException('Invalid webhook data', HttpStatus.BAD_REQUEST);
        }

        await this.paymentRepository.updatePaymentStatusByReference(reference, 'success');

        await this.prisma.order.update({
          where: { id: metadata.orderId },
          data: {
            status: OrderStatus.PROCESSING,
            payment: {
              update: {
                status: 'success',
              },
            },
          },
        });

        this.logger.debug(`Webhook handled successfully for reference: ${reference}, orderId: ${metadata.orderId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle webhook event: ${payload.event}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to handle webhook', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}