import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  SEED_PRODUCTS,
  SEED_KEYS,
  SEED_PROMOCODES,
  Product,
  Order,
  PromocodeEntity,
} from '@gg/shared';
import { AppModule } from '../../src/main.js';

export interface KeyRecord {
  id: string;
  product_sku: string;
  key_code: string;
  is_used: boolean;
  order_id: string | null;
  assigned_at: string | null;
}

export interface PaymentEventRecord {
  event_id: string;
  order_id: string;
  status: 'paid' | 'failed';
  amount: number;
  currency: string;
  created_at: string;
}

export class InMemoryTestDb {
  public products: Map<string, Product> = new Map();
  public keys: KeyRecord[] = [];
  public orders: Map<string, Order> = new Map();
  public paymentEvents: Map<string, PaymentEventRecord> = new Map();
  public promocodes: Map<string, PromocodeEntity> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.products.clear();
    for (const p of SEED_PRODUCTS) {
      this.products.set(p.sku, { ...p });
    }

    this.keys = SEED_KEYS.map((k, index) => ({
      id: `key_${index + 1}`,
      product_sku: k.sku,
      key_code: k.key,
      is_used: false,
      order_id: null,
      assigned_at: null,
    }));

    this.orders.clear();
    this.paymentEvents.clear();

    this.promocodes.clear();
    for (const promo of SEED_PROMOCODES) {
      this.promocodes.set(promo.code, {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        currency: promo.currency,
        max_uses: promo.max_uses,
        used_count: promo.used_count,
      });
    }
  }

  public getKeysForSku(sku: string): KeyRecord[] {
    return this.keys.filter((k) => k.product_sku === sku);
  }

  public getAvailableKeysForSku(sku: string): KeyRecord[] {
    return this.keys.filter((k) => k.product_sku === sku && !k.is_used);
  }

  public getAssignedKeysForOrder(orderId: string): KeyRecord[] {
    return this.keys.filter((k) => k.order_id === orderId);
  }
}

export interface TestHarness {
  app: INestApplication;
  agent: ReturnType<typeof request>;
  db: InMemoryTestDb;
  cleanup: () => Promise<void>;
  resetData: () => void;
}

export async function createTestHarness(): Promise<TestHarness> {
  const db = new InMemoryTestDb();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.enableCors();
  await app.init();

  const agent = request(app.getHttpServer());

  const cleanup = async () => {
    await app.close();
  };

  const resetData = () => {
    db.reset();
  };

  return {
    app,
    agent,
    db,
    cleanup,
    resetData,
  };
}
