import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  HttpStatus, 
  Res, 
  Req, 
  BadRequestException,
  Headers,
  RawBodyRequest
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PaymentsService } from './payments.service';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('paystack/initiate')
  async initiatePayment(
    @Body() initiatePaymentDto: InitiatePaymentDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.paymentsService.initiatePayment(
        initiatePaymentDto.amount,
        initiatePaymentDto.email,
      );

      return res.status(HttpStatus.CREATED).json(result);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        message: error.message || 'Failed to initiate payment',
      });
    }
  }

  @Post('paystack/webhook')
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
  ) {
    try {
      // Get raw body for signature verification
      const rawBody = req.body;
      const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);

      // Verify signature
      const isValid = await this.paymentsService.verifyWebhookSignature(
        payload,
        signature,
      );

      if (!isValid) {
        throw new BadRequestException('Invalid webhook signature');
      }

      // Parse the event
      const event = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      // Handle the webhook event
      await this.paymentsService.handleWebhook(event);

      return res.status(HttpStatus.OK).json({ status: true });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        message: error.message || 'Webhook processing failed',
      });
    }
  }

  @Get(':reference/status')
  async getTransactionStatus(
    @Param('reference') reference: string,
    @Query('refresh') refresh: string,
    @Res() res: Response,
  ) {
    try {
      const shouldRefresh = refresh === 'true';
      const transaction = await this.paymentsService.getTransactionStatus(
        reference,
        shouldRefresh,
      );

      return res.status(HttpStatus.OK).json({
        reference: transaction.reference,
        status: transaction.status,
        amount: transaction.amount,
        paid_at: transaction.paidAt,
      });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        message: error.message || 'Failed to fetch transaction status',
      });
    }
  }
}