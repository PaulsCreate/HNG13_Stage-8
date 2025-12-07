import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  Headers, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  @UseGuards(AuthGuard('jwt'))
  async initiatePayment(
    @Req() req: any,
    @Body() body: { amount: number },
  ) {
    const userId = req.user.id;
    return this.paymentsService.initiatePayment(userId, body.amount);
  }

  @Post('paystack/webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(payload, signature);
  }

  @Get(':reference/status')
  @UseGuards(AuthGuard('jwt'))
  async getPaymentStatus(
    @Param('reference') reference: string,
    @Query('refresh') refresh: string,
    @Req() req: any,
  ) {
    const transaction = await this.paymentsService.verifyPayment(
      reference,
      refresh === 'true',
    );

    if (transaction.user.id !== req.user.id) {
      throw new BadRequestException('Unauthorized access to transaction');
    }

    return {
      reference: transaction.reference,
      status: transaction.status,
      amount: transaction.amount,
      paid_at: transaction.paid_at,  // Fixed: using paid_at (with underscore)
    };
  }
}