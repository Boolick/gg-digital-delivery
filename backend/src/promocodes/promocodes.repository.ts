import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { PromocodeEntity } from '@gg/shared';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class PromocodesRepository {
  constructor(private readonly db: DatabaseService) {}

  public async findPromocode(code: string, client?: PoolClient): Promise<PromocodeEntity | null> {
    const query = 'SELECT * FROM promocodes WHERE code = $1 OR code = UPPER($1);';
    const res = client
      ? await client.query<PromocodeEntity>(query, [code])
      : await this.db.query<PromocodeEntity>(query, [code]);
    return res.rows[0] || null;
  }

  public async atomicReservePromocode(
    code: string,
    client?: PoolClient,
  ): Promise<PromocodeEntity | null> {
    const query = `
      UPDATE promocodes
      SET used_count = used_count + 1
      WHERE (code = $1 OR code = UPPER($1)) AND used_count < max_uses
      RETURNING code, type, value, currency, max_uses, used_count;
    `;
    const res = client
      ? await client.query<PromocodeEntity>(query, [code])
      : await this.db.query<PromocodeEntity>(query, [code]);
    return res.rows[0] || null;
  }
}
