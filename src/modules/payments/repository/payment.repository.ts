import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new payment record.
   * Ensures reference is set if not already provided.
   */
  async createPayment(data: Prisma.PaymentCreateInput): Promise<Payment> {
    this.logger.debug(`Creating payment with data: ${JSON.stringify(data)}`);
    try {
      const paymentData = {
        ...data,
        reference: data.reference || uuidv4(), // Generate reference if not provided
      };
      const payment = await this.prisma.payment.create({ data: paymentData });
      this.logger.debug(`Payment created successfully: ${payment.id}, reference: ${payment.reference}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to create payment with data: ${JSON.stringify(data)}`, error.stack);
      throw new HttpException('Failed to create payment record', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update the status of a payment by its reference string.
   * @deprecated – prefer updatePaymentStatusByReference.
   */
  async updatePaymentStatus(reference: string, status: string): Promise<void> {
    this.logger.debug(`Updating payment status for reference: ${reference}, status: ${status}`);
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { reference },
      });

      if (!payment) {
        this.logger.warn(`Payment with reference ${reference} not found`);
        throw new HttpException(
          `Payment with reference ${reference} not found`,
          HttpStatus.NOT_FOUND,
        );
      }

      await this.prisma.payment.update({
        where: { reference },
        data: { status },
      });
      this.logger.debug(`Payment status updated successfully for reference: ${reference}`);
    } catch (error) {
      this.logger.error(`Failed to update payment status for reference: ${reference}`, error.stack);
      throw error instanceof HttpException
        ? error
        : new HttpException('Failed to update payment status', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update the status of a payment by its reference string.
   */
  async updatePaymentStatusByReference(reference: string, status: string): Promise<Payment> {
    this.logger.debug(`Updating payment status by reference: ${reference}, status: ${status}`);
    try {
      const payment = await this.prisma.payment.update({
        where: { reference },
        data: { status },
      });
      this.logger.debug(`Payment status updated successfully for reference: ${reference}`);
      return payment;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        this.logger.warn(`Payment with reference ${reference} not found`);
        throw new HttpException(
          `Payment with reference ${reference} not found`,
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(`Failed to update payment status for reference: ${reference}`, error.stack);
      throw new HttpException('Failed to update payment status by reference', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Find a payment using the order ID.
   */
  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    this.logger.debug(`Finding payment by orderId: ${orderId}`);
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { orderId },
      });
      this.logger.debug(`Payment ${payment ? 'found' : 'not found'} for orderId: ${orderId}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to find payment by orderId: ${orderId}`, error.stack);
      throw new HttpException('Failed to find payment by order ID', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Find a payment using the Paystack reference string.
   */
  async findPaymentByReference(reference: string): Promise<Payment | null> {
    this.logger.debug(`Finding payment by reference: ${reference}`);
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { reference },
      });
      this.logger.debug(`Payment ${payment ? 'found' : 'not found'} for reference: ${reference}`);
      return payment;
    } catch (error) {
      this.logger.error(`Failed to find payment by reference: ${reference}`, error.stack);
      throw new HttpException('Failed to find payment by reference', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}