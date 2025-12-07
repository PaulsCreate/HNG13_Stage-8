import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';

interface InitializeTransactionDto {
  email: string;
  amount: number;
  reference: string;
  metadata?: any;
}

interface PaystackResponse {
  status: boolean;
  message: string;
  data: any;
}

@Injectable()
export class PaystackService {
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get('PAYSTACK_SECRET_KEY') || '';
    this.webhookSecret = this.configService.get('PAYSTACK_WEBHOOK_SECRET') || '';
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async initializeTransaction(data: InitializeTransactionDto): Promise<PaystackResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: data.email,
          amount: data.amount,
          reference: data.reference,
          metadata: data.metadata,
          callback_url: `${this.configService.get('FRONTEND_URL')}/payment/callback`,
        },
        { headers: this.getHeaders() },
      );

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Paystack initialization failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  async verifyTransaction(reference: string): Promise<PaystackResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        { headers: this.getHeaders() },
      );

      return response.data;
    } catch (error: any) {
      throw new BadRequestException(
        `Paystack verification failed: ${error.response?.data?.message || error.message}`,
      );
    }
  }

  async verifyWebhookSignature(payload: any, signature: string): Promise<boolean> {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return hash === signature;
  }
}