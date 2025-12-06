import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionStatus } from '../transactions/entities/transaction.entity';

@Injectable()
export class PaymentsService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private readonly configService: ConfigService,
    private readonly transactionsService: TransactionsService,
  ) {}

  async initiatePayment(amount: number, email?: string, userId?: string) {
    // Validate amount
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Generate unique reference
    const reference = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check for duplicate (idempotency)
    const exists = await this.transactionsService.exists(reference);
    if (exists) {
      const existingTransaction = await this.transactionsService.findByReference(reference);
      return {
        reference: existingTransaction.reference,
        authorization_url: existingTransaction.authorizationUrl,
      };
    }

    try {
      // Call Paystack Initialize Transaction API
      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          amount: amount,
          email: email || 'customer@example.com', // Paystack requires an email
          reference: reference,
        },
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const { authorization_url, access_code } = response.data.data;

      // Save transaction to database
      await this.transactionsService.create(
        reference,
        amount,
        authorization_url,
        userId,
      );

      return {
        reference,
        authorization_url,
      };
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(
          `Paystack error: ${error.response.data.message || 'Payment initiation failed'}`,
        );
      }
      throw new InternalServerErrorException('Failed to initiate payment');
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
  const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');
  
  if (!secret) {
    throw new InternalServerErrorException('Webhook secret not configured');
  }

  const hash = crypto
    .createHmac('sha512', secret)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

  async handleWebhook(event: any) {
    const { event: eventType, data } = event;

    if (eventType === 'charge.success') {
      const { reference, amount, paid_at, status } = data;

      const transactionStatus = status === 'success' 
        ? TransactionStatus.SUCCESS 
        : TransactionStatus.FAILED;

      await this.transactionsService.updateStatus(
        reference,
        transactionStatus,
        paid_at ? new Date(paid_at) : undefined,
      );
    }
  }

  async getTransactionStatus(reference: string, refresh: boolean = false) {
    const transaction = await this.transactionsService.findByReference(reference);

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${reference} not found`);
    }

    // If refresh is requested, call Paystack verify endpoint
    if (refresh) {
      try {
        const response = await axios.get(
          `${this.paystackBaseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.configService.get<string>('PAYSTACK_SECRET_KEY')}`,
            },
          },
        );

        const { status, amount, paid_at } = response.data.data;

        const transactionStatus = status === 'success' 
          ? TransactionStatus.SUCCESS 
          : status === 'failed'
          ? TransactionStatus.FAILED
          : TransactionStatus.PENDING;

        await this.transactionsService.updateStatus(
          reference,
          transactionStatus,
          paid_at ? new Date(paid_at) : undefined,
        );

        // Fetch updated transaction
        return this.transactionsService.findByReference(reference);
      } catch (error) {
        // If Paystack call fails, return DB status
        return transaction;
      }
    }

    return transaction;
  }
}