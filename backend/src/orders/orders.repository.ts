import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Order, OrderStatus, ProviderUsed, AdminOrderListItem } from '@gg/shared';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class OrdersRepository {
  constructor(private readonly db: DatabaseService) {}

  public async createOrder(order: Order, client?: PoolClient): Promise<Order> {
    const query = `
      INSERT INTO orders (
        id, sku, status, amount, original_amount, discount_amount,
        currency, promo_code, key_code, provider_used, error_message,
        delivery_attempts, email, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const params = [
      order.id,
      order.sku,
      order.status,
      order.amount,
      order.original_amount,
      order.discount_amount,
      order.currency,
      order.promo_code ?? null,
      order.key_code ?? null,
      order.provider_used ?? null,
      order.error_message ?? null,
      order.delivery_attempts,
      order.email ?? null,
      order.created_at,
      order.updated_at,
    ];
    if (client) {
      await client.query(query, params);
    } else {
      await this.db.query(query, params);
    }
    return order;
  }

  public async getOrderById(id: string, client?: PoolClient): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    const res = client
      ? await client.query<Order>(query, [id])
      : await this.db.query<Order>(query, [id]);
    return res.rows[0] || null;
  }

  public async lockOrderForUpdate(client: PoolClient, id: string): Promise<Order | null> {
    const res = await client.query<Order>('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    return res.rows[0] || null;
  }

  public async updateOrderStatus(
    client: PoolClient,
    id: string,
    status: OrderStatus,
    keyCode?: string,
    errorMessage?: string,
    providerUsed?: ProviderUsed,
  ): Promise<void> {
    const query = `
      UPDATE orders
      SET status = $2, key_code = COALESCE($3, key_code),
          error_message = $4, provider_used = COALESCE($5, provider_used),
          updated_at = NOW()
      WHERE id = $1;
    `;
    await client.query(query, [
      id,
      status,
      keyCode ?? null,
      errorMessage ?? null,
      providerUsed ?? null,
    ]);
  }

  public async findProblematicOrders(): Promise<AdminOrderListItem[]> {
    const query = `
      SELECT id as order_id, sku, status, amount as final_amount, currency,
             created_at, updated_at, key_code, delivery_attempts as attempts,
             error_message
      FROM orders
      WHERE status IN ('out_of_stock', 'delivery_failed')
      ORDER BY created_at DESC;
    `;
    const res = await this.db.query<AdminOrderListItem>(query);
    return res.rows;
  }
}
