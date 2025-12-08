import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { PaystackService } from './paystack.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private paystackService: PaystackService,
  ) {}

  async initiatePayment(userId: string, amount: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (amount < 100) {
      throw new BadRequestException('Amount must be at least 10000 kobo (100 NGN)');
    }

    const existingTransaction = await this.transactionRepository.findOne({
      where: {
        userId,
        amount,
        status: TransactionStatus.PENDING,
      },
      order: { createdAt: 'DESC' },
    });

    if (existingTransaction) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      if (existingTransaction.createdAt > tenMinutesAgo) {
        return {
          reference: existingTransaction.reference,
          authorization_url: existingTransaction.authorizationUrl,
        };
      }
    }

    const reference = `HKG_${uuidv4().replace(/-/g, '').substring(0, 20)}`;

    const paystackResponse = await this.paystackService.initializeTransaction({
      email: user.email,
      amount: amount * 100,
      reference,
      metadata: {
        userId,
        userName: user.name,
      },
    });

    const transaction = this.transactionRepository.create({
      reference,
      amount,
      status: TransactionStatus.PENDING,
      paystackReference: paystackResponse.data.reference,
      authorizationUrl: paystackResponse.data.authorization_url,
      user,
      metadata: {
        userEmail: user.email,
        userName: user.name,
      },
    });

    await this.transactionRepository.save(transaction);

    return {
      reference: transaction.reference,
      authorization_url: transaction.authorizationUrl,
    };
  }

  async verifyPayment(reference: string, refresh: boolean = false) {
    const transaction = await this.transactionRepository.findOne({
      where: { reference },
      relations: ['user'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (refresh || transaction.status === TransactionStatus.PENDING) {
      const paystackResponse = await this.paystackService.verifyTransaction(
        transaction.paystackReference,
      );

      transaction.status = paystackResponse.data.status === 'success' 
        ? TransactionStatus.SUCCESS 
        : TransactionStatus.FAILED;
      
      if (paystackResponse.data.paid_at) {
        transaction.paidAt = new Date(paystackResponse.data.paid_at);
      }

      await this.transactionRepository.save(transaction);
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      paid_at: transaction.paidAt,  // This returns paidAt as paid_at
      user: {
        id: transaction.user.id,
        email: transaction.user.email,
        name: transaction.user.name,
      },
    };
  }

  async handleWebhook(payload: any, signature: string) {
    const isValid = await this.paystackService.verifyWebhookSignature(
      payload,
      signature,
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const { event, data } = payload;

    if (event === 'charge.success') {
      const transaction = await this.transactionRepository.findOne({
        where: { paystackReference: data.reference },
      });

      if (transaction) {
        transaction.status = TransactionStatus.SUCCESS;
        transaction.paidAt = new Date(data.paid_at);
        await this.transactionRepository.save(transaction);
      }
    } else if (event === 'charge.failed') {
      const transaction = await this.transactionRepository.findOne({
        where: { paystackReference: data.reference },
      });

      if (transaction) {
        transaction.status = TransactionStatus.FAILED;
        await this.transactionRepository.save(transaction);
      }
    }

    return { status: true };
  }
}