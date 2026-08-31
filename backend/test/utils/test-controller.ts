import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Module,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import {
  Order,
  CreateOrderRequest,
  CreateOrderRequestSchema,
  CreateOrderResponse,
  GetOrderStatusResponse,
  PaymentWebhookPayload,
  PaymentWebhookPayloadSchema,
  PaymentWebhookResponse,
  AdminRetryDeliveryResponse,
  AdminRestockKeysRequest,
  AdminRestockKeysRequestSchema,
  AdminRestockKeysResponse,
  ValidatePromocodeRequest,
  ValidatePromocodeRequestSchema,
  ValidatePromocodeResponse,
} from '@gg/shared';
import { InMemoryTestDb } from './test-db.js';

let currentDb = new InMemoryTestDb();

export function setTestControllerDb(db: InMemoryTestDb): void {
  currentDb = db;
}

@Controller('api')
export class TestApiController {
  @Post('orders')
  public async createOrder(@Body() body: unknown): Promise<CreateOrderResponse> {
    const data: CreateOrderRequest = CreateOrderRequestSchema.parse(body);
    const skuKey = data.sku.toUpperCase();
    const product = currentDb.products.get(skuKey) || currentDb.products.get(data.sku);
    if (!product) {
      throw new NotFoundException(`Product ${data.sku} not found`);
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const originalAmount = product.price;
    let discountAmount = 0;

    if (data.promo_code) {
      const release = await currentDb.acquireLock(`promo_${data.promo_code}`);
      try {
        const promo = currentDb.promocodes.get(data.promo_code);
        if (promo && promo.used_count < promo.max_uses) {
          promo.used_count += 1;
          discountAmount =
            promo.type === 'percent'
              ? Math.round((originalAmount * promo.value) / 100)
              : Math.min(originalAmount, promo.value);
        }
      } finally {
        release();
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      sku: data.sku,
      status: 'created',
      amount: finalAmount,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      currency: product.currency,
      promo_code: data.promo_code,
      key_code: undefined,
      error_message: undefined,
      delivery_attempts: 0,
      email: data.email,
      created_at: now,
      updated_at: now,
    };

    currentDb.orders.set(orderId, order);

    return {
      order_id: order.id,
      sku: order.sku,
      status: order.status,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount,
      final_amount: order.amount,
      currency: order.currency,
      created_at: order.created_at,
    };
  }

  @Get('orders/:id')
  public async getOrder(@Param('id') id: string): Promise<GetOrderStatusResponse> {
    const order = currentDb.orders.get(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return {
      order_id: order.id,
      sku: order.sku,
      status: order.status,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount,
      final_amount: order.amount,
      currency: order.currency,
      key_code: order.key_code,
      error_message: order.error_message,
      can_retry: order.status === 'out_of_stock' || order.status === 'delivery_failed',
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }

  @Post('webhooks/payment')
  @HttpCode(HttpStatus.OK)
  public async handlePaymentWebhook(@Body() body: unknown): Promise<PaymentWebhookResponse> {
    const data: PaymentWebhookPayload = PaymentWebhookPayloadSchema.parse(body);

    const releaseDedup = await currentDb.acquireLock(`evt_${data.event_id}`);
    try {
      if (currentDb.paymentEvents.has(data.event_id)) {
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Event already processed (deduplicated)',
        };
      }
      currentDb.paymentEvents.set(data.event_id, {
        event_id: data.event_id,
        order_id: data.order_id,
        status: data.status,
        amount: data.amount,
        currency: data.currency,
        created_at: data.created_at,
      });
    } finally {
      releaseDedup();
    }

    const order = currentDb.orders.get(data.order_id);
    if (!order) {
      return {
        status: 'ignored',
        order_id: data.order_id,
        event_id: data.event_id,
        message: 'Order not found (out-of-order webhook registered)',
      };
    }

    const releaseOrder = await currentDb.acquireLock(`order_${data.order_id}`);
    try {
      if (order.status === 'delivered' || order.status === 'delivering') {
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Order already delivering or delivered',
        };
      }

      if (data.status === 'failed') {
        order.status = 'payment_failed';
        order.updated_at = new Date().toISOString();
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Order payment failed',
        };
      }

      order.status = 'delivering';
      const orderSkuUpper = order.sku.toUpperCase();
      const availableKey = currentDb.keys.find(
        (k) => (k.product_sku === order.sku || k.product_sku === orderSkuUpper) && !k.is_used,
      );

      if (availableKey) {
        availableKey.is_used = true;
        availableKey.order_id = order.id;
        availableKey.assigned_at = new Date().toISOString();
        order.status = 'delivered';
        order.key_code = availableKey.key_code;
      } else {
        order.status = 'out_of_stock';
        order.error_message = 'No available keys in pool';
      }

      order.updated_at = new Date().toISOString();

      return {
        status: 'ok',
        order_id: data.order_id,
        event_id: data.event_id,
        message: order.status === 'delivered' ? 'Key issued' : 'Out of stock',
      };
    } finally {
      releaseOrder();
    }
  }

  @Post('admin/orders/:id/retry-delivery')
  @HttpCode(HttpStatus.OK)
  public async retryDelivery(@Param('id') id: string): Promise<AdminRetryDeliveryResponse> {
    const order = currentDb.orders.get(id);
    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    const releaseOrder = await currentDb.acquireLock(`order_${id}`);
    try {
      if (order.status === 'delivered') {
        return {
          status: 'ok',
          order_id: id,
          new_status: 'delivered',
          key_code: order.key_code,
          message: 'Order already delivered',
        };
      }

      const orderSkuUpper = order.sku.toUpperCase();
      const availableKey = currentDb.keys.find(
        (k) => (k.product_sku === order.sku || k.product_sku === orderSkuUpper) && !k.is_used,
      );
      if (availableKey) {
        availableKey.is_used = true;
        availableKey.order_id = order.id;
        availableKey.assigned_at = new Date().toISOString();
        order.status = 'delivered';
        order.key_code = availableKey.key_code;
        order.error_message = undefined;
        order.updated_at = new Date().toISOString();
        return {
          status: 'ok',
          order_id: id,
          new_status: 'delivered',
          key_code: availableKey.key_code,
        };
      }

      return {
        status: 'error',
        order_id: id,
        new_status: 'out_of_stock',
        message: 'Still out of stock',
      };
    } finally {
      releaseOrder();
    }
  }

  @Post('admin/keys/restock')
  @HttpCode(HttpStatus.OK)
  public async restockKeys(@Body() body: unknown): Promise<AdminRestockKeysResponse> {
    const data: AdminRestockKeysRequest = AdminRestockKeysRequestSchema.parse(body);
    for (const key of data.keys) {
      currentDb.keys.push({
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product_sku: data.sku,
        key_code: key,
        is_used: false,
        order_id: null,
        assigned_at: null,
      });
    }
    const total = currentDb.getAvailableKeysForSku(data.sku).length;
    return {
      success: true,
      sku: data.sku,
      added_count: data.keys.length,
      total_available: total,
    };
  }

  @Post('promocodes/validate')
  @HttpCode(HttpStatus.OK)
  public async validatePromocode(@Body() body: unknown): Promise<ValidatePromocodeResponse> {
    const data: ValidatePromocodeRequest = ValidatePromocodeRequestSchema.parse(body);
    const promo = currentDb.promocodes.get(data.code);
    if (!promo || promo.used_count >= promo.max_uses) {
      return {
        valid: false,
        code: data.code,
        discount_amount: 0,
        final_amount: data.amount,
        reason: !promo ? 'Invalid promocode' : 'Promocode usage limit reached',
      };
    }

    const discountAmount =
      promo.type === 'percent'
        ? Math.round((data.amount * promo.value) / 100)
        : Math.min(data.amount, promo.value);

    return {
      valid: true,
      code: promo.code,
      type: promo.type,
      value: promo.value,
      discount_amount: discountAmount,
      final_amount: Math.max(0, data.amount - discountAmount),
    };
  }
}

@Module({
  controllers: [TestApiController],
})
export class TestAppModule {}
