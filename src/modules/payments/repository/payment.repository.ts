import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid'; // Make sure to install uuid package

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new payment record.
   * Ensures reference is set if not already provided.
   */
  async createPayment(data: Prisma.PaymentCreateInput): Promise<Payment> {
    try {
      

      return await this.prisma.payment.create({ data });
    } catch (error) {
      this.logger.error('Error creating payment record', error);
      throw new Error('Failed to create payment record');
    }
  }

  /**
   * Update the status of a payment by its ID.
   * Deprecated – prefer updating by reference.
   */
  async updatePaymentStatus(reference: string, status: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference }, // ✅ use reference, not id
    });
  
    if (!payment) {
      this.logger.warn(`Payment with reference ${reference} not found.`);
      throw new Error(`Payment with reference ${reference} not found.`);
    }
  
    await this.prisma.payment.update({
      where: { reference },
      data: { status },
    });
  }
  

  /**
   * Update the status of a payment by its reference string.
   */
  async updatePaymentStatusByReference(reference: string, status: string): Promise<Payment> {
    try {
      return await this.prisma.payment.update({
        where: { reference },
        data: { status },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Payment with reference ${reference} not found.`);
        throw new Error(`Payment with reference ${reference} not found.`);
      }

      this.logger.error(`Error updating payment with reference ${reference}`, error);
      throw new Error('Failed to update payment status by reference');
    }
  }

  /**
   * Find a payment using the order ID.
   */
  async findPaymentByOrderId(orderId: string): Promise<Payment | null> {
    try {
      return await this.prisma.payment.findUnique({
        where: { orderId },
      });
    } catch (error) {
      this.logger.error('Error finding payment by order ID', error);
      throw new Error('Failed to find payment by order ID');
    }
  }

  /**
   * Find a payment using the Paystack reference string.
   */
  async findPaymentByReference(reference: string): Promise<Payment | null> {
    try {
      return await this.prisma.payment.findUnique({
        where: { reference },
      });
    } catch (error) {
      this.logger.error('Error finding payment by reference', error);
      throw new Error('Failed to find payment by reference');
    }
  }
}
