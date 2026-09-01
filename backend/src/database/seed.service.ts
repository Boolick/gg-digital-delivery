import { Injectable, Logger } from '@nestjs/common';
import { SEED_PRODUCTS, SEED_KEYS, SEED_PROMOCODES } from '@gg/shared';
import { DatabaseService } from './database.service.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly db: DatabaseService) {}

  public async seedDatabaseIfEmpty(): Promise<void> {
    try {
      const prodCountRes = await this.db.query('SELECT count(*)::int as count FROM products');
      const count = (prodCountRes.rows[0] as { count: number })?.count ?? 0;
      if (count > 0) {
        return;
      }

      this.logger.log('Seeding initial dataset from @gg/shared...');
      await this.db.transaction(async (client) => {
        for (const p of SEED_PRODUCTS) {
          await client.query(
            'INSERT INTO products (sku, name, type, price, currency, image) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (sku) DO NOTHING',
            [p.sku, p.name, p.type, p.price, p.currency, p.image],
          );
        }

        for (let i = 0; i < SEED_KEYS.length; i += 1) {
          const key = SEED_KEYS[i];
          const prod = SEED_PRODUCTS[i % SEED_PRODUCTS.length];
          if (key && prod) {
            await client.query(
              'INSERT INTO product_keys (id, product_sku, key_code, is_used) VALUES ($1, $2, $3, false) ON CONFLICT (id) DO NOTHING',
              [`key_${i + 1}`, prod.sku, key],
            );
          }
        }

        for (const promo of SEED_PROMOCODES) {
          await client.query(
            'INSERT INTO promocodes (code, type, value, currency, max_uses, used_count) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (code) DO NOTHING',
            [promo.code, promo.type, promo.value, promo.currency, promo.max_uses, promo.used_count],
          );
        }
      });
      this.logger.log('Database seeding complete');
    } catch (err) {
      this.logger.debug(`Seed skipped or table missing: ${(err as Error).message}`);
    }
  }
}
