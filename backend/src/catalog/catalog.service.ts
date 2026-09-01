import { Injectable } from '@nestjs/common';
import { CatalogResponse, Product, SEED_PRODUCTS } from '@gg/shared';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class CatalogService {
  constructor(private readonly db: DatabaseService) {}

  public async getCatalog(): Promise<CatalogResponse> {
    try {
      const res = await this.db.query<Product>('SELECT * FROM products ORDER BY price ASC');
      if (res.rows.length > 0) {
        return {
          currency_note: 'Все цены указаны в рублях (RUB) с учетом НДС',
          products: res.rows.map((r) => ({ ...r, price: Number(r.price) })),
        };
      }
    } catch {
      // fallback to seed if DB uninitialized
    }

    return {
      currency_note: 'Все цены указаны в рублях (RUB) с учетом НДС',
      products: SEED_PRODUCTS.map((p) => ({ ...p })),
    };
  }
}
