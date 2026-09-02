import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import pg, { PoolClient, QueryResult } from 'pg';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  SEED_PRODUCTS,
  SEED_KEYS,
  SEED_PROMOCODES,
  Order,
  OrderStatus,
  ProviderUsed,
  AdminOrderListItem,
  Product,
  PromocodeEntity,
} from '@gg/shared';

const { Pool } = pg;

export interface InMemoryKeyRecord {
  id: string;
  product_sku: string;
  key_code: string;
  is_used: boolean;
  order_id: string | null;
  assigned_at: string | null;
}

export interface InMemoryProviderRequest {
  request_id: string;
  order_id: string;
  sku: string;
  provider: string;
  status: string;
  code: string | null;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: pg.Pool;
  private isPostgres = false;

  // In-Memory storage structures for fallback mode
  private memProducts: Product[] = [];
  private memKeys: InMemoryKeyRecord[] = [];
  private memPromocodes: PromocodeEntity[] = [];
  private memOrders = new Map<string, Order>();
  private memPaymentEvents = new Set<string>();
  private memProviderRequests = new Map<string, InMemoryProviderRequest>();

  public async onModuleInit(): Promise<void> {
    const connectionString =
      process.env['DATABASE_URL'] || 'postgresql://postgres:postgres@localhost:5432/gg_delivery';
    const isSsl = connectionString.includes('sslmode=require') || process.env['DB_SSL'] === 'true';

    this.pool = new Pool({
      connectionString,
      max: 20,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 30000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });

    try {
      const client = await this.pool.connect();
      try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
          const sql = fs.readFileSync(schemaPath, 'utf8');
          await client.query(sql);
          this.logger.log('Database schema successfully initialized in PostgreSQL');
        }
        this.isPostgres = true;
        this.logger.log('Connected to PostgreSQL successfully');
      } finally {
        client.release();
      }
    } catch (err) {
      this.isPostgres = false;
      this.logger.warn(
        `PostgreSQL not reachable (${(err as Error).message}). Active In-Memory fallback mode.`,
      );
      this.seedInMemory();
    }
  }

  private seedInMemory(): void {
    this.memProducts = SEED_PRODUCTS.map((p) => ({ ...p }));
    this.memKeys = SEED_KEYS.map((key, i) => {
      const prod = SEED_PRODUCTS[i % SEED_PRODUCTS.length];
      return {
        id: `key_${i + 1}`,
        product_sku: prod?.sku || 'STEAM-TOPUP-500',
        key_code: key,
        is_used: false,
        order_id: null,
        assigned_at: null,
      };
    });
    this.memPromocodes = SEED_PROMOCODES.map((p) => ({ ...p }));
    this.logger.log(
      `In-Memory seeded with ${this.memProducts.length} products, ${this.memKeys.length} keys, ${this.memPromocodes.length} promocodes`,
    );
  }

  public async onModuleDestroy(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  public async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    if (this.isPostgres) {
      return this.pool.query<T>(text, params);
    }
    return this.executeInMemory<T>(text, params);
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (this.isPostgres) {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    // In-Memory Transaction Mock
    const mockClient = {
      query: (t: string, p?: unknown[]) => this.executeInMemory(t, p),
      release: () => {},
    } as unknown as PoolClient;

    return callback(mockClient);
  }

  public getPool(): pg.Pool {
    return this.pool;
  }

  public isUsingPostgres(): boolean {
    return this.isPostgres;
  }

  private executeInMemory<T extends pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    const trimmed = text.trim();
    const p = params || [];

    // 1. SELECT count(*)::int as count FROM products
    if (trimmed.includes('FROM products') && trimmed.includes('count(*)')) {
      return Promise.resolve({
        rows: [{ count: this.memProducts.length }] as unknown as T[],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 2. SELECT * FROM products
    if (trimmed.includes('FROM products')) {
      if (
        trimmed.includes('WHERE sku = $1') ||
        trimmed.includes('sku = $1') ||
        trimmed.includes('sku = UPPER($1)')
      ) {
        const sku = String(p[0] || '').toUpperCase();
        const prod = this.memProducts.find((item) => item.sku.toUpperCase() === sku);
        return Promise.resolve({
          rows: (prod ? [prod] : []) as unknown as T[],
          rowCount: prod ? 1 : 0,
          command: 'SELECT',
          oid: 0,
          fields: [],
        });
      }
      const sorted = [...this.memProducts].sort((a, b) => a.price - b.price);
      return Promise.resolve({
        rows: sorted as unknown as T[],
        rowCount: sorted.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 3. Promocode Lookup: SELECT * FROM promocodes WHERE code = $1 OR code = UPPER($1)
    if (trimmed.includes('FROM promocodes WHERE code = $1')) {
      const code = String(p[0] || '').toUpperCase();
      const promo = this.memPromocodes.find((item) => item.code.toUpperCase() === code);
      return Promise.resolve({
        rows: (promo ? [promo] : []) as unknown as T[],
        rowCount: promo ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 4. Atomic Promocode Reserve: UPDATE promocodes SET used_count = used_count + 1 WHERE ...
    if (
      trimmed.startsWith('UPDATE promocodes') &&
      trimmed.includes('used_count = used_count + 1')
    ) {
      const code = String(p[0] || '').toUpperCase();
      const promo = this.memPromocodes.find((item) => item.code.toUpperCase() === code);
      if (promo && promo.used_count < promo.max_uses) {
        promo.used_count += 1;
        return Promise.resolve({
          rows: [promo] as unknown as T[],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: [],
        });
      }
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });
    }

    // 5. Key allocation: UPDATE product_keys SET is_used = true, order_id = $1 ...
    if (trimmed.startsWith('UPDATE product_keys') && trimmed.includes('is_used = true')) {
      const orderId = String(p[0]);
      const sku = String(p[1]);
      const availableKey = this.memKeys.find(
        (k) => (k.product_sku === sku || k.product_sku === sku.toUpperCase()) && !k.is_used,
      );
      if (availableKey) {
        availableKey.is_used = true;
        availableKey.order_id = orderId;
        availableKey.assigned_at = new Date().toISOString();
        return Promise.resolve({
          rows: [availableKey] as unknown as T[],
          rowCount: 1,
          command: 'UPDATE',
          oid: 0,
          fields: [],
        });
      }
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });
    }

    // 6. Restock Keys: INSERT INTO product_keys
    if (trimmed.startsWith('INSERT INTO product_keys')) {
      const id = String(p[0]);
      const sku = String(p[1]);
      const keyCode = String(p[2]);
      this.memKeys.push({
        id,
        product_sku: sku,
        key_code: keyCode,
        is_used: false,
        order_id: null,
        assigned_at: null,
      });
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });
    }

    // 7. Available Keys Count: SELECT count(*)::int as count FROM product_keys WHERE ...
    if (trimmed.includes('FROM product_keys') && trimmed.includes('count(*)')) {
      const sku = String(p[0]);
      const count = this.memKeys.filter(
        (k) => (k.product_sku === sku || k.product_sku === sku.toUpperCase()) && !k.is_used,
      ).length;
      return Promise.resolve({
        rows: [{ count }] as unknown as T[],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 8. INSERT INTO orders ...
    if (trimmed.startsWith('INSERT INTO orders')) {
      const order: Order = {
        id: String(p[0]),
        sku: String(p[1]),
        status: p[2] as OrderStatus,
        amount: Number(p[3]),
        original_amount: Number(p[4]),
        discount_amount: Number(p[5] ?? 0),
        currency: p[6] as 'RUB' | 'USD' | 'KZT',
        promo_code: p[7] ? String(p[7]) : undefined,
        key_code: p[8] ? String(p[8]) : undefined,
        provider_used: p[9] ? (p[9] as ProviderUsed) : undefined,
        error_message: p[10] ? String(p[10]) : undefined,
        delivery_attempts: Number(p[11] ?? 0),
        email: p[12] ? String(p[12]) : undefined,
        created_at: String(p[13]),
        updated_at: String(p[14]),
      };
      this.memOrders.set(order.id, order);
      return Promise.resolve({
        rows: [order] as unknown as T[],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });
    }

    // 9. SELECT * FROM orders WHERE id = $1
    if (trimmed.includes('FROM orders WHERE id = $1')) {
      const id = String(p[0]);
      const order = this.memOrders.get(id);
      return Promise.resolve({
        rows: (order ? [order] : []) as unknown as T[],
        rowCount: order ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 10. UPDATE orders SET status = $2 ...
    if (trimmed.startsWith('UPDATE orders') && trimmed.includes('SET status = $2')) {
      const id = String(p[0]);
      const status = p[1] as OrderStatus;
      const keyCode = p[2] ? String(p[2]) : undefined;
      const errorMessage = p[3] ? String(p[3]) : undefined;
      const providerUsed = p[4] ? (p[4] as ProviderUsed) : undefined;

      const order = this.memOrders.get(id);
      if (order) {
        order.status = status;
        if (keyCode) {
          order.key_code = keyCode;
        }
        if (errorMessage) {
          order.error_message = errorMessage;
        }
        if (providerUsed) {
          order.provider_used = providerUsed;
        }
        order.updated_at = new Date().toISOString();
      }
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: order ? 1 : 0,
        command: 'UPDATE',
        oid: 0,
        fields: [],
      });
    }

    // 11. Problematic orders for Admin: SELECT ... FROM orders WHERE status IN ('out_of_stock', 'delivery_failed')
    if (trimmed.includes('FROM orders WHERE status IN')) {
      const problemOrders: AdminOrderListItem[] = [];
      for (const ord of this.memOrders.values()) {
        if (ord.status === 'out_of_stock' || ord.status === 'delivery_failed') {
          const product = this.memProducts.find((p) => p.sku === ord.sku);
          problemOrders.push({
            order_id: ord.id,
            sku: ord.sku,
            product_name: product?.name || ord.sku,
            status: ord.status,
            final_amount: ord.amount,
            currency: ord.currency,
            created_at: ord.created_at,
            updated_at: ord.updated_at,
            key_code: ord.key_code,
            attempts: ord.delivery_attempts,
            error_message: ord.error_message,
          });
        }
      }
      return Promise.resolve({
        rows: problemOrders as unknown as T[],
        rowCount: problemOrders.length,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 12. Payment events deduplication: SELECT event_id FROM payment_events WHERE event_id = $1
    if (trimmed.includes('FROM payment_events WHERE event_id = $1')) {
      const eventId = String(p[0]);
      const exists = this.memPaymentEvents.has(eventId);
      return Promise.resolve({
        rows: (exists ? [{ event_id: eventId }] : []) as unknown as T[],
        rowCount: exists ? 1 : 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 13. Record payment event: INSERT INTO payment_events ...
    if (trimmed.startsWith('INSERT INTO payment_events')) {
      const eventId = String(p[0]);
      this.memPaymentEvents.add(eventId);
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });
    }

    // 14. Provider requests cache: SELECT provider, code, request_id FROM provider_requests ...
    if (trimmed.includes('FROM provider_requests WHERE order_id = $1 AND status = $2')) {
      const orderId = String(p[0]);
      const status = String(p[1]);
      for (const req of this.memProviderRequests.values()) {
        if (req.order_id === orderId && req.status === status && req.code) {
          return Promise.resolve({
            rows: [
              { provider: req.provider, code: req.code, request_id: req.request_id },
            ] as unknown as T[],
            rowCount: 1,
            command: 'SELECT',
            oid: 0,
            fields: [],
          });
        }
      }
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 0,
        command: 'SELECT',
        oid: 0,
        fields: [],
      });
    }

    // 15. Save provider request: INSERT INTO provider_requests ...
    if (trimmed.startsWith('INSERT INTO provider_requests')) {
      const reqId = String(p[0]);
      const orderId = String(p[1]);
      const sku = String(p[2]);
      const provider = String(p[3]);
      const status = String(p[4]);
      const code = p[5] ? String(p[5]) : null;
      this.memProviderRequests.set(reqId, {
        request_id: reqId,
        order_id: orderId,
        sku,
        provider,
        status,
        code,
      });
      return Promise.resolve({
        rows: [] as unknown as T[],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      });
    }

    // 16. BEGIN, COMMIT, ROLLBACK, Seed queries
    return Promise.resolve({
      rows: [] as unknown as T[],
      rowCount: 0,
      command: 'QUERY',
      oid: 0,
      fields: [],
    });
  }
}
