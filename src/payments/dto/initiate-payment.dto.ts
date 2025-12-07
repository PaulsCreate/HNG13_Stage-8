import { IsNumber, IsPositive, Min } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Amount must be at least 100 kobo (1 NGN)' })
  amount: number;
}