import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionStatus } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async create(
    reference: string,
    amount: number,
    authorizationUrl: string,
    userId?: string,
  ): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      reference,
      amount,
      authorizationUrl,
      status: TransactionStatus.PENDING,
      userId,
    });

    return this.transactionRepository.save(transaction);
  }

  async findByReference(reference: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({ 
      where: { reference },
      relations: ['user'],
    });
  }

  async updateStatus(
    reference: string,
    status: TransactionStatus,
    paidAt?: Date,
  ): Promise<Transaction> {
    const transaction = await this.findByReference(reference);
    
    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${reference} not found`);
    }

    transaction.status = status;
    if (paidAt) {
      transaction.paidAt = paidAt;
    }

    return this.transactionRepository.save(transaction);
  }

  async exists(reference: string): Promise<boolean> {
    const count = await this.transactionRepository.count({ where: { reference } });
    return count > 0;
  }
}