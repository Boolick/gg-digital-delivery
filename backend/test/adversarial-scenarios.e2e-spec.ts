import { createTestHarness, TestHarness } from './utils/test-harness.js';
import { runConcurrent } from './utils/concurrency-runner.js';
import {
  CreateOrderResponseSchema,
  GetOrderStatusResponseSchema,
  PaymentWebhookResponseSchema,
  AdminRetryDeliveryResponseSchema,
  AdminRestockKeysResponseSchema,
} from '@gg/shared';

describe('Adversarial E2E Scenarios (TDD Concurrency Test Suite)', () => {
  let harness: TestHarness;

  beforeAll(async () => {
    harness = await createTestHarness();
  });

  afterAll(async () => {
    await harness.cleanup();
  });

  beforeEach(() => {
    harness.resetData();
  });

  // =========================================================================
  // SCENARIO 1: The Webhook Stampede (50 Parallel Webhooks)
  // =========================================================================
  describe('Scenario 1: Concurrency Webhook Stampede (50 Threads)', () => {
    it('should issue exactly 1 key and prevent double delivery when 50 webhooks hit simultaneously', async () => {
      // 1. Create order
      const createRes = await harness.agent
        .post('/api/orders')
        .send({ sku: 'STEAM-TOPUP-1000', email: 'test@example.com' })
        .expect(201);

      const orderData = CreateOrderResponseSchema.parse(createRes.body);
      const orderId = orderData.order_id;

      // 2. Fire 50 simultaneous webhooks for the exact same order
      const concurrency = 50;
      const metrics = await runConcurrent(async (index) => {
        const response = await harness.agent
          .post('/api/webhooks/payment')
          .send({
            event_id: `evt_stampede_${orderId}_${index}`,
            order_id: orderId,
            status: 'paid',
            amount: 1000,
            currency: 'RUB',
            created_at: new Date().toISOString(),
          });
        return {
          status: response.status,
          body: PaymentWebhookResponseSchema.parse(response.body),
        };
      }, concurrency);

      // Assertions
      expect(metrics.successCount).toBe(50);
      expect(metrics.failureCount).toBe(0);

      // 3. Verify order status
      const statusRes = await harness.agent.get(`/api/orders/${orderId}`).expect(200);
      const finalOrder = GetOrderStatusResponseSchema.parse(statusRes.body);
      expect(finalOrder.status).toBe('delivered');
      expect(finalOrder.key_code).toBeDefined();
      expect(typeof finalOrder.key_code).toBe('string');

      // 4. Critical Invariant: Check in-memory/database key allocations
      const assignedKeys = harness.db.getAssignedKeysForOrder(orderId);
      expect(assignedKeys.length).toBe(1);
      expect(assignedKeys[0]?.key_code).toBe(finalOrder.key_code);
    });
  });

  // =========================================================================
  // SCENARIO 2: Idempotent Deduplication (Exact Same Event ID)
  // =========================================================================
  describe('Scenario 2: Deduplication / Idempotent Webhook Processing', () => {
    it('should handle repeated webhooks with identical event_id idempotently without duplicate issuance', async () => {
      // 1. Create order
      const createRes = await harness.agent
        .post('/api/orders')
        .send({ sku: 'STEAM-TOPUP-1000' })
        .expect(201);
      const { order_id: orderId } = CreateOrderResponseSchema.parse(createRes.body);

      const eventId = `evt_dedup_fixed_${orderId}`;
      const payload = {
        event_id: eventId,
        order_id: orderId,
        status: 'paid' as const,
        amount: 1000,
        currency: 'RUB' as const,
        created_at: new Date().toISOString(),
      };

      // 2. First Webhook
      const res1 = await harness.agent.post('/api/webhooks/payment').send(payload).expect(200);
      const body1 = PaymentWebhookResponseSchema.parse(res1.body);
      expect(body1.status).toBe('ok');

      // 3. Second Webhook with identical event_id
      const res2 = await harness.agent.post('/api/webhooks/payment').send(payload).expect(200);
      const body2 = PaymentWebhookResponseSchema.parse(res2.body);
      expect(body2.status).toBe('ok');
      expect(body2.message).toContain('deduplicated');

      // 4. Verify invariant: exactly 1 key allocated
      const assignedKeys = harness.db.getAssignedKeysForOrder(orderId);
      expect(assignedKeys.length).toBe(1);
    });
  });

  // =========================================================================
  // SCENARIO 3: Out-of-Order Webhook Delivery
  // =========================================================================
  describe('Scenario 3: Out-of-Order Webhook Delivery', () => {
    it('should gracefully handle webhook arriving before order creation or for unknown order', async () => {
      const ghostOrderId = `order_ghost_${Date.now()}`;
      const payload = {
        event_id: `evt_ooo_${ghostOrderId}`,
        order_id: ghostOrderId,
        status: 'paid' as const,
        amount: 500,
        currency: 'RUB' as const,
        created_at: new Date().toISOString(),
      };

      const res = await harness.agent.post('/api/webhooks/payment').send(payload).expect(200);
      const body = PaymentWebhookResponseSchema.parse(res.body);
      expect(body.status).toBe('ignored');
      expect(body.message).toContain('Order not found');
    });
  });

  // =========================================================================
  // SCENARIO 4: Out of Stock & Admin Reissue Flow
  // =========================================================================
  describe('Scenario 4: Out of Stock & Admin Reissue', () => {
    it('should transition order to out_of_stock when pool is empty, then deliver key on admin retry', async () => {
      const targetSku = 'STEAM-TOPUP-500';

      // 1. Drain keys for target SKU
      for (const k of harness.db.keys) {
        if (k.product_sku === targetSku) {
          k.is_used = true;
          k.order_id = 'order_drained_pretest';
        }
      }
      expect(harness.db.getAvailableKeysForSku(targetSku).length).toBe(0);

      // 2. Create order for drained SKU
      const createRes = await harness.agent
        .post('/api/orders')
        .send({ sku: targetSku })
        .expect(201);
      const { order_id: orderId } = CreateOrderResponseSchema.parse(createRes.body);

      // 3. Payment webhook hits empty pool
      await harness.agent
        .post('/api/webhooks/payment')
        .send({
          event_id: `evt_oos_${orderId}`,
          order_id: orderId,
          status: 'paid',
          amount: 500,
          currency: 'RUB',
          created_at: new Date().toISOString(),
        })
        .expect(200);

      // 4. Order status should be 'out_of_stock'
      const statusRes1 = await harness.agent.get(`/api/orders/${orderId}`).expect(200);
      const oosOrder = GetOrderStatusResponseSchema.parse(statusRes1.body);
      expect(oosOrder.status).toBe('out_of_stock');
      expect(oosOrder.key_code).toBeUndefined();
      expect(oosOrder.can_retry).toBe(true);

      // 5. Restock keys via Admin API
      const newKeys = ['NEW_RESTOCKED_STEAM_500_KEY_A', 'NEW_RESTOCKED_STEAM_500_KEY_B'];
      const restockRes = await harness.agent
        .post('/api/admin/keys/restock')
        .send({ sku: targetSku, keys: newKeys })
        .expect(200);
      const restockData = AdminRestockKeysResponseSchema.parse(restockRes.body);
      expect(restockData.added_count).toBe(2);

      // 6. Admin triggers retry delivery
      const retryRes = await harness.agent
        .post(`/api/admin/orders/${orderId}/retry-delivery`)
        .expect(200);
      const retryData = AdminRetryDeliveryResponseSchema.parse(retryRes.body);
      expect(retryData.status).toBe('ok');
      expect(retryData.new_status).toBe('delivered');
      expect(retryData.key_code).toBe('NEW_RESTOCKED_STEAM_500_KEY_A');

      // 7. Verify final order status
      const statusRes2 = await harness.agent.get(`/api/orders/${orderId}`).expect(200);
      const deliveredOrder = GetOrderStatusResponseSchema.parse(statusRes2.body);
      expect(deliveredOrder.status).toBe('delivered');
      expect(deliveredOrder.key_code).toBe('NEW_RESTOCKED_STEAM_500_KEY_A');
    });
  });

  // =========================================================================
  // SCENARIO 5: Promocode Concurrency Race (50 Parallel Requests)
  // =========================================================================
  describe('Scenario 5: Promocode Concurrency Race (50 Threads with max_uses = 3)', () => {
    it('should apply discount to strictly N orders and full price to 50 - N orders under concurrent race', async () => {
      const promoCode = 'LIMIT3'; // seed data has max_uses = 3
      const concurrency = 50;

      const metrics = await runConcurrent(async (index) => {
        const res = await harness.agent
          .post('/api/orders')
          .send({
            sku: 'STEAM-TOPUP-1000',
            promo_code: promoCode,
            email: `user_${index}@example.com`,
          });
        return {
          status: res.status,
          order: CreateOrderResponseSchema.parse(res.body),
        };
      }, concurrency);

      expect(metrics.successCount).toBe(50);

      const discountedOrders = metrics.responses.filter((r) => r.order.discount_amount > 0);
      const fullPriceOrders = metrics.responses.filter((r) => r.order.discount_amount === 0);

      // Invariant: Exactly 3 orders got the discount
      expect(discountedOrders.length).toBe(3);
      expect(fullPriceOrders.length).toBe(47);

      // Verify each discounted order has correct math (LIMIT3 gives 300 RUB off or percentage)
      for (const d of discountedOrders) {
        expect(d.order.final_amount).toBe(d.order.original_amount - d.order.discount_amount);
      }

      // Check DB promocode state
      const promoEntity = harness.db.promocodes.get(promoCode);
      expect(promoEntity?.used_count).toBe(3);
    });
  });
});
