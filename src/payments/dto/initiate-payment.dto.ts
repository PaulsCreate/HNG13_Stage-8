import { IsNumber, IsPositive, Min } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  @Min(10000, { message: 'Amount must be at least 10000 kobo (100 NGN)' })
  amount: number;
}