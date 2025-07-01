import { 
  Body, 
  Controller, 
  Headers, 
  HttpCode, 
  HttpStatus, 
  Post, 
  Get,
  Query,
  Res,
  UseGuards, 
  UnauthorizedException, 
  BadRequestException, 
  InternalServerErrorException 
} from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { InitializePaymentDto } from '../dto/initialize-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';
import { JwtAuthGuard } from 'src/common/guards';
import { GetUser } from 'src/common/decorators';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { PaystackService } from '../provider/paystack.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {

  constructor(
    private readonly paymentService: PaymentService,
    private readonly paystackService: PaystackService,
  ) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initialize payment for an order' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment initialized successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid request' })
  async initializePayment(
    @GetUser() user: User,
    @Body() dto: InitializePaymentDto,
  ) {
    const orderId = dto.metadata?.orderId;
    if (!orderId) {
      throw new BadRequestException('Order ID is required in metadata');
    }
    return this.paymentService.initializePayment(user.id, orderId, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a payment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment verified successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid reference' })
  async verifyPayment(
    @GetUser() user: User,
    @Body() dto: VerifyPaymentDto
  ) {
    return this.paymentService.verifyPayment(user.id, dto);
  }

  // Add this endpoint to handle the callback redirect
  @Get('callback')
  @ApiOperation({ summary: 'Handle payment callback redirect from Paystack' })
  @ApiResponse({ status: HttpStatus.FOUND, description: 'Redirect to frontend' })
  async handlePaymentCallback(
    @Query('reference') reference: string,
    @Res() res: Response,
  ) {
    try {
      if (!reference) {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?error=missing_reference`);
      }

      // Verify payment using existing service
      const verificationResponse = await this.paystackService.verifyPayment(reference);
      
      if (verificationResponse.data.status === 'success') {
        // Use existing webhook handler logic
        await this.paymentService.handleWebhook({
          event: 'charge.success',
          data: verificationResponse.data
        });
        
        return res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${reference}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reference=${reference}`);
      }
    } catch (error) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/error?reference=${reference}`);
    }
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Paystack webhook' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Webhook processed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid signature' })
  @ApiResponse({ status: HttpStatus.INTERNAL_SERVER_ERROR, description: 'Error processing webhook' })
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    if (!this.paystackService.verifyWebhookSignature(payload, signature)) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    try {
      await this.paymentService.handleWebhook(payload);
      return { status: 'success' };
    } catch (error) {
      throw new InternalServerErrorException('Error processing webhook');
    }
  }
}