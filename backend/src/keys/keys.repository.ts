import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service.js';

export interface KeyRecord {
  id: string;
  product_sku: string;
  key_code: string;
  is_used: boolean;
  order_id: string | null;
  assigned_at: string | null;
}

@Injectable()
export class KeysRepository {
  private readonly logger = new Logger(KeysRepository.name);

  constructor(private readonly db: DatabaseService) {}

  public async allocateKeyForOrder(
    client: PoolClient,
    sku: string,
    orderId: string,
  ): Promise<KeyRecord | null> {
    const query = `
      UPDATE product_keys
      SET is_used = true, order_id = $1, assigned_at = NOW()
      WHERE id = (
        SELECT id FROM product_keys
        WHERE (product_sku = $2 OR product_sku = UPPER($2)) AND is_used = false
        ORDER BY id ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, product_sku, key_code, is_used, order_id, assigned_at;
    `;
    const res = await client.query<KeyRecord>(query, [orderId, sku]);
    return res.rows[0] || null;
  }

  public async restockKeys(sku: string, keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    let added = 0;
    await this.db.transaction(async (client) => {
      for (const k of keys) {
        const id = `key_restock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        await client.query(
          'INSERT INTO product_keys (id, product_sku, key_code, is_used) VALUES ($1, $2, $3, false)',
          [id, sku, k],
        );
        added += 1;
      }
    });
    this.logger.log(`Restocked ${added} keys for SKU '${sku}'`);
    return added;
  }

  public async getAvailableKeysCount(sku: string): Promise<number> {
    const res = await this.db.query<{ count: number }>(
      'SELECT count(*)::int as count FROM product_keys WHERE (product_sku = $1 OR product_sku = UPPER($1)) AND is_used = false',
      [sku],
    );
    return res.rows[0]?.count ?? 0;
  }
}
