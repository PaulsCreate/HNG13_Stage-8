import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class InitiatePaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number; // Amount in kobo (lowest currency unit)

  @IsOptional()
  @IsString()
  email?: string; // Optional: email for payment
}