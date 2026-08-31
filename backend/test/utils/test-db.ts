import {
  SEED_PRODUCTS,
  SEED_KEYS,
  SEED_PROMOCODES,
  Product,
  Order,
  PromocodeEntity,
} from '@gg/shared';

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
  public simulateProviderAFail = false;
  public requireWebhookHmac = false;
  public requireAdminAuth = false;
  public adminSecret = 'test-admin-secret-2026';
  public webhookSecret = 'test-webhook-secret-2026';
  private locks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.reset();
  }

  public reset(): void {
    this.products.clear();
    for (const p of SEED_PRODUCTS) {
      this.products.set(p.sku, { ...p });
    }

    this.keys = SEED_KEYS.map((k, index) => {
      const prod = SEED_PRODUCTS[index % SEED_PRODUCTS.length];
      return {
        id: `key_${index + 1}`,
        product_sku: prod ? prod.sku : 'STEAM-TOPUP-1000',
        key_code: k,
        is_used: false,
        order_id: null,
        assigned_at: null,
      };
    });

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
    this.simulateProviderAFail = false;
    this.requireWebhookHmac = false;
    this.requireAdminAuth = false;
    this.locks.clear();
  }

  public async acquireLock(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }
    let resolveLock!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });
    this.locks.set(key, promise);
    return () => {
      this.locks.delete(key);
      resolveLock();
    };
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
