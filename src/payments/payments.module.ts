import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaystackService } from './paystack.service';
import { PaymentsController } from './payments.controller';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService],
  exports: [PaymentsService],
})
export class PaymentsModule {}