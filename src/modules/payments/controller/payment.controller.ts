import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req, UseGuards, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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