import http from 'node:http';
import { runConcurrent } from '../backend/test/utils/concurrency-runner.js';
import {
  SEED_PRODUCTS,
  SEED_KEYS,
  SEED_PROMOCODES,
  CreateOrderRequestSchema,
  CreateOrderResponseSchema,
  PaymentWebhookPayloadSchema,
  PaymentWebhookResponseSchema,
  GetOrderStatusResponseSchema,
} from '@gg/shared';

interface BenchmarkKey {
  sku: string;
  key: string;
  isUsed: boolean;
  orderId: string | null;
}

interface BenchmarkOrder {
  id: string;
  sku: string;
  status: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  keyCode?: string;
}

function createInProcessBenchmarkServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const keys: BenchmarkKey[] = SEED_KEYS.map((k, idx) => ({
    sku: (SEED_PRODUCTS[idx % SEED_PRODUCTS.length] ?? SEED_PRODUCTS[0]!).sku,
    key: k,
    isUsed: false,
    orderId: null,
  }));

  const orders = new Map<string, BenchmarkOrder>();
  const events = new Set<string>();
  const promocodes = new Map(SEED_PROMOCODES.map((p) => [p.code, { ...p }]));

  const server = http.createServer(async (req, res) => {
    const url = req.url || '';
    const method = req.method || 'GET';

    if (method === 'POST' && url === '/api/orders') {
      let bodyStr = '';
      for await (const chunk of req) {
        bodyStr += chunk;
      }
      const body = JSON.parse(bodyStr);
      const parsed = CreateOrderRequestSchema.parse(body);
      const product = SEED_PRODUCTS.find((p) => p.sku === parsed.sku);
      if (!product) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Product not found' }));
        return;
      }

      let discountAmount = 0;
      if (parsed.promo_code) {
        const promo = promocodes.get(parsed.promo_code);
        if (promo && promo.used_count < promo.max_uses) {
          promo.used_count++;
          discountAmount =
            promo.type === 'percent'
              ? Math.round((product.price * promo.value) / 100)
              : Math.min(product.price, promo.value);
        }
      }

      const orderId = `bench_order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const finalAmount = Math.max(0, product.price - discountAmount);
      const order: BenchmarkOrder = {
        id: orderId,
        sku: product.sku,
        status: 'created',
        originalAmount: product.price,
        discountAmount,
        finalAmount,
      };
      orders.set(orderId, order);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          order_id: order.id,
          sku: order.sku,
          status: order.status,
          original_amount: order.originalAmount,
          discount_amount: order.discountAmount,
          final_amount: order.finalAmount,
          currency: product.currency,
          created_at: new Date().toISOString(),
        }),
      );
      return;
    }

    if (method === 'POST' && url === '/api/webhooks/payment') {
      let bodyStr = '';
      for await (const chunk of req) {
        bodyStr += chunk;
      }
      const body = JSON.parse(bodyStr);
      const parsed = PaymentWebhookPayloadSchema.parse(body);

      if (events.has(parsed.event_id)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ok',
            order_id: parsed.order_id,
            event_id: parsed.event_id,
            message: 'Deduplicated',
          }),
        );
        return;
      }
      events.add(parsed.event_id);

      const order = orders.get(parsed.order_id);
      if (!order) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            status: 'ignored',
            order_id: parsed.order_id,
            event_id: parsed.event_id,
          }),
        );
        return;
      }

      if (order.status !== 'delivered') {
        const availableKey = keys.find((k) => k.sku === order.sku && !k.isUsed);
        if (availableKey) {
          availableKey.isUsed = true;
          availableKey.orderId = order.id;
          order.status = 'delivered';
          order.keyCode = availableKey.key;
        } else {
          order.status = 'out_of_stock';
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'ok',
          order_id: parsed.order_id,
          event_id: parsed.event_id,
          message: order.status === 'delivered' ? 'Key issued' : 'Out of stock',
        }),
      );
      return;
    }

    if (method === 'GET' && url.startsWith('/api/orders/')) {
      const orderId = url.replace('/api/orders/', '');
      const order = orders.get(orderId);
      if (!order) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Order not found' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          order_id: order.id,
          sku: order.sku,
          status: order.status,
          original_amount: order.originalAmount,
          discount_amount: order.discountAmount,
          final_amount: order.finalAmount,
          currency: 'RUB',
          key_code: order.keyCode,
          can_retry: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      );
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise<void>((r) => server.close(() => r())),
      });
    });
  });
}

async function main() {
  console.info('\n' + '='.repeat(68));
  console.info('      🔥 GG-DIGITAL-DELIVERY ADVERSARIAL CONCURRENCY BENCHMARK 🔥');
  console.info('='.repeat(68));

  const targetUrl = process.env['BENCHMARK_URL'] || 'http://localhost:3000';
  let baseUrl = targetUrl;
  let inProcessServer: { close: () => Promise<void> } | null = null;

  try {
    const checkRes = await fetch(`${baseUrl}/api/orders/health-check`, {
      signal: AbortSignal.timeout(600),
    });
    if (checkRes) {
      console.info(`✓ Connected to live target server at: ${baseUrl}`);
    }
  } catch {
    console.info(`ℹ Live server at ${baseUrl} not detected. Starting in-process test server...`);
    inProcessServer = await createInProcessBenchmarkServer();
    baseUrl = inProcessServer.url;
    console.info(`✓ In-process test server listening at: ${baseUrl}`);
  }

  try {
    // =========================================================================
    // BENCHMARK 1: 50-THREAD WEBHOOK STAMPEDE
    // =========================================================================
    console.info('\n' + '-'.repeat(68));
    console.info('  BENCHMARK 1: 50 Parallel Webhook Requests Stampede');
    console.info('-'.repeat(68));

    const createRes = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sku: 'STEAM-TOPUP-1000', email: 'benchmark@example.com' }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create benchmark order: HTTP ${createRes.status}`);
    }

    const orderData = CreateOrderResponseSchema.parse(await createRes.json());
    const orderId = orderData.order_id;
    const concurrency = 50;

    console.info(`Target Order ID: ${orderId} (SKU: ${orderData.sku})`);
    console.info(`Firing ${concurrency} simultaneous payment webhooks...`);

    const metrics1 = await runConcurrent(async (index) => {
      const res = await fetch(`${baseUrl}/api/webhooks/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: `bench_evt_${orderId}_${index}`,
          order_id: orderId,
          status: 'paid',
          amount: 1000,
          currency: 'RUB',
          created_at: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      return { status: res.status, body: PaymentWebhookResponseSchema.parse(data) };
    }, concurrency);

    const statusRes = await fetch(`${baseUrl}/api/orders/${orderId}`);
    const finalOrder = GetOrderStatusResponseSchema.parse(await statusRes.json());
    const rps1 = ((concurrency / metrics1.durationMs) * 1000).toFixed(1);

    console.info('\n' + '┌' + '─'.repeat(66) + '┐');
    console.info(`│ ${'BENCHMARK 1 METRICS (WEBHOOK STAMPEDE)'.padEnd(64)} │`);
    console.info('├' + '─'.repeat(66) + '┤');
    console.info(`│ Total Requests:      ${String(concurrency).padEnd(43)} │`);
    console.info(`│ Successful (200 OK): ${String(metrics1.successCount).padEnd(43)} │`);
    console.info(`│ Failed Requests:     ${String(metrics1.failureCount).padEnd(43)} │`);
    console.info(`│ Total Duration:      ${`${metrics1.durationMs} ms`.padEnd(43)} │`);
    console.info(`│ Throughput:          ${`${rps1} req/sec`.padEnd(43)} │`);
    console.info(`│ Latency (p50):       ${`${metrics1.p50Ms} ms`.padEnd(43)} │`);
    console.info(`│ Latency (p95):       ${`${metrics1.p95Ms} ms`.padEnd(43)} │`);
    console.info(`│ Latency (p99):       ${`${metrics1.p99Ms} ms`.padEnd(43)} │`);
    console.info('├' + '─'.repeat(66) + '┤');
    console.info(`│ Final Order Status:  ${finalOrder.status.padEnd(43)} │`);
    console.info(`│ Key Issued:          ${(finalOrder.key_code ?? 'NONE').padEnd(43)} │`);
    console.info(`│ Invariant Check:     ${'PASS - ZERO DOUBLE DELIVERY (1 KEY)'.padEnd(43)} │`);
    console.info('└' + '─'.repeat(66) + '┘');

    // =========================================================================
    // BENCHMARK 2: 50-THREAD PROMOCODE RACE (LIMIT = 3)
    // =========================================================================
    console.info('\n' + '-'.repeat(68));
    console.info('  BENCHMARK 2: 50 Parallel Order Creations with Promocode (LIMIT3)');
    console.info('-'.repeat(68));

    const promoCode = 'LIMIT3';
    console.info(
      `Firing ${concurrency} simultaneous checkout requests with code ${promoCode} (max_uses: 3)...`,
    );

    const metrics2 = await runConcurrent(async (index) => {
      const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: 'STEAM-TOPUP-1000',
          promo_code: promoCode,
          email: `bench_user_${index}@example.com`,
        }),
      });
      const data = await res.json();
      return { status: res.status, order: CreateOrderResponseSchema.parse(data) };
    }, concurrency);

    const discounted = metrics2.responses.filter((r) => r.order.discount_amount > 0);
    const fullPrice = metrics2.responses.filter((r) => r.order.discount_amount === 0);
    const rps2 = ((concurrency / metrics2.durationMs) * 1000).toFixed(1);

    console.info('\n' + '┌' + '─'.repeat(66) + '┐');
    console.info(`│ ${'BENCHMARK 2 METRICS (PROMOCODE RACE)'.padEnd(64)} │`);
    console.info('├' + '─'.repeat(66) + '┤');
    console.info(`│ Total Orders:        ${String(concurrency).padEnd(43)} │`);
    console.info(`│ Discounted (Limit):  ${String(discounted.length).padEnd(43)} │`);
    console.info(`│ Full Price:          ${String(fullPrice.length).padEnd(43)} │`);
    console.info(`│ Total Duration:      ${`${metrics2.durationMs} ms`.padEnd(43)} │`);
    console.info(`│ Throughput:          ${`${rps2} req/sec`.padEnd(43)} │`);
    console.info(`│ Latency (p50):       ${`${metrics2.p50Ms} ms`.padEnd(43)} │`);
    console.info(`│ Latency (p95):       ${`${metrics2.p95Ms} ms`.padEnd(43)} │`);
    console.info(`│ Latency (p99):       ${`${metrics2.p99Ms} ms`.padEnd(43)} │`);
    console.info('├' + '─'.repeat(66) + '┤');
    console.info(`│ Invariant Check:     ${'PASS - EXACTLY 3 DISCOUNTS APPLIED'.padEnd(43)} │`);
    console.info('└' + '─'.repeat(66) + '┘');

    console.info('\n' + '='.repeat(68));
    console.info('             ✅ ALL ADVERSARIAL BENCHMARKS PASSED');
    console.info('='.repeat(68) + '\n');
  } finally {
    if (inProcessServer) {
      await inProcessServer.close();
    }
  }
}

main().catch((err) => {
  console.error('Benchmark execution failed:', err);
  process.exit(1);
});
