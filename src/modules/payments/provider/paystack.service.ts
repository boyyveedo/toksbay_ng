import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

import axios from 'axios';
import { IPaymentProvider,PaymentInitializeResponse, PaymentInitData, PaymentVerifyResponse } from '../interfaces';


@Injectable()
export class PaystackService implements IPaymentProvider {
  private readonly logger = new Logger(PaystackService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!apiKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not defined in environment variables');
    }
    this.apiKey = apiKey;  
    this.baseUrl = 'https://api.paystack.co';
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    if (!signature) {
      this.logger.warn('No signature provided in webhook request');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  async initializePayment(data: PaymentInitData): Promise<PaymentInitializeResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: data.email,
          amount: data.amount * 100, // Paystack uses kobo (multiply by 100)
          reference: data.reference,
          metadata: data.metadata,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.data;
    } catch (error) {
      this.logger.error('Error initializing Paystack payment', error.response?.data);
      throw new Error('Failed to initialize payment');
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error verifying Paystack payment', error.response?.data);
      throw new Error('Failed to verify payment');
    }
  }
}