import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, UsePipes } from '@nestjs/common';
import {
  PaymentWebhookPayload,
  PaymentWebhookPayloadSchema,
  PaymentWebhookResponse,
} from '@gg/shared';
import { WebhooksService } from './webhooks.service.js';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard.js';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.js';

@Controller('api/webhooks')
@UseGuards(WebhookSignatureGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(PaymentWebhookPayloadSchema))
  public async handlePaymentWebhook(
    @Body() body: PaymentWebhookPayload,
  ): Promise<PaymentWebhookResponse> {
    return this.webhooksService.handlePaymentWebhook(body);
  }
}
