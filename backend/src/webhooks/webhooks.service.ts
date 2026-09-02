import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { PaymentWebhookPayload, PaymentWebhookResponse } from '@gg/shared';
import { DatabaseService } from '../database/database.service.js';
import { OrdersRepository } from '../orders/orders.repository.js';
import { KeysRepository } from '../keys/keys.repository.js';
import { IssueEngineService } from '../providers/issue-engine.service.js';
import { OrderFsmService } from '../fsm/order-fsm.service.js';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly ordersRepo: OrdersRepository,
    private readonly keysRepo: KeysRepository,
    private readonly issueEngine: IssueEngineService,
    private readonly fsm: OrderFsmService,
  ) {}

  public async handlePaymentWebhook(data: PaymentWebhookPayload): Promise<PaymentWebhookResponse> {
    const existing = await this.db.query(
      'SELECT event_id FROM payment_events WHERE event_id = $1',
      [data.event_id],
    );
    if (existing.rows.length > 0) {
      return {
        status: 'ok',
        order_id: data.order_id,
        event_id: data.event_id,
        message: 'Event already processed (deduplicated)',
      };
    }

    return this.db.transaction(async (client) => {
      const order = await this.ordersRepo.lockOrderForUpdate(client, data.order_id);
      if (!order) {
        this.logger.warn(`Order ${data.order_id} not found for webhook event ${data.event_id}`);
        return {
          status: 'ignored',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Order not found (out-of-order webhook registered)',
        };
      }

      await this.recordPaymentEvent(client, data);
      const nextTarget = data.status === 'failed' ? 'payment_failed' : 'paid';
      if (!this.fsm.canTransition(order.status, nextTarget) && order.status !== 'created') {
        return {
          status: 'ignored',
          order_id: data.order_id,
          event_id: data.event_id,
          message: `FSM transition from ${order.status} to ${nextTarget} rejected`,
        };
      }

      if (order.status === 'delivered' || order.status === 'delivering') {
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Order already delivering or delivered',
        };
      }

      if (data.status === 'failed') {
        this.fsm.transition(order.status, 'payment_failed', order.id);
        await this.ordersRepo.updateOrderStatus(
          client,
          order.id,
          'payment_failed',
          undefined,
          'Payment gateway failed',
        );
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Order payment failed',
        };
      }

      let currentStatus = order.status;
      if (currentStatus === 'created') {
        this.fsm.transition('created', 'paid', order.id);
        currentStatus = 'paid';
      }

      this.fsm.transition(currentStatus, 'delivering', order.id);
      const localKey = await this.keysRepo.allocateKeyForOrder(client, order.sku, order.id);
      if (localKey) {
        this.fsm.transition('delivering', 'delivered', order.id);
        const provUsed = process.env['SIMULATE_PROVIDER_A_FAIL'] === 'true' ? 'B' : 'A';
        await this.ordersRepo.updateOrderStatus(
          client,
          order.id,
          'delivered',
          localKey.key_code,
          undefined,
          provUsed,
        );
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: 'Key issued',
        };
      }

      const provResult = await this.issueEngine.issueKeyWithFallback(order.sku, order.id);
      if (provResult) {
        this.fsm.transition('delivering', 'delivered', order.id);
        await this.ordersRepo.updateOrderStatus(
          client,
          order.id,
          'delivered',
          provResult.code,
          undefined,
          provResult.provider,
        );
        return {
          status: 'ok',
          order_id: data.order_id,
          event_id: data.event_id,
          message: `Key issued via provider ${provResult.provider}`,
        };
      }

      this.fsm.transition('delivering', 'out_of_stock', order.id);
      await this.ordersRepo.updateOrderStatus(
        client,
        order.id,
        'out_of_stock',
        undefined,
        'No available keys in pool',
      );
      return {
        status: 'ok',
        order_id: data.order_id,
        event_id: data.event_id,
        message: 'Out of stock',
      };
    });
  }

  private async recordPaymentEvent(client: PoolClient, data: PaymentWebhookPayload): Promise<void> {
    await client.query(
      'INSERT INTO payment_events (event_id, order_id, status, amount, currency, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (event_id) DO NOTHING',
      [data.event_id, data.order_id, data.status, data.amount, data.currency, data.created_at],
    );
  }
}
