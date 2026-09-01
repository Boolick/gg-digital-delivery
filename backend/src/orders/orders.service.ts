import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  GetOrderStatusResponse,
  Order,
  Product,
} from '@gg/shared';
import { OrdersRepository } from './orders.repository.js';
import { DatabaseService } from '../database/database.service.js';

import { PromocodesRepository } from '../promocodes/promocodes.repository.js';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly ordersRepo: OrdersRepository,
    private readonly promocodesRepo: PromocodesRepository,
    private readonly db: DatabaseService,
  ) {}

  public async createOrder(data: CreateOrderRequest): Promise<CreateOrderResponse> {
    const prodRes = await this.db.query<Product>(
      'SELECT * FROM products WHERE sku = $1 OR sku = UPPER($1)',
      [data.sku],
    );
    const product = prodRes.rows[0];
    if (!product) {
      throw new NotFoundException(`Product SKU '${data.sku}' not found`);
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const originalAmount = Number(product.price);
    let discountAmount = 0;

    if (data.promo_code) {
      const promo = await this.promocodesRepo.atomicReservePromocode(data.promo_code);
      if (promo) {
        discountAmount =
          promo.type === 'percent'
            ? Math.round((originalAmount * Number(promo.value)) / 100)
            : Math.min(originalAmount, Number(promo.value));
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const now = new Date().toISOString();
    const order: Order = {
      id: orderId,
      sku: product.sku,
      status: 'created',
      amount: finalAmount,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      currency: product.currency,
      promo_code: data.promo_code,
      delivery_attempts: 0,
      email: data.email,
      created_at: now,
      updated_at: now,
    };

    await this.ordersRepo.createOrder(order);
    this.logger.log(`Created order ${order.id} for SKU ${order.sku} (amount: ${order.amount})`);

    return {
      order_id: order.id,
      sku: order.sku,
      status: order.status,
      original_amount: order.original_amount,
      discount_amount: order.discount_amount,
      final_amount: order.amount,
      currency: order.currency,
      created_at: order.created_at,
    };
  }

  public async getOrderStatus(id: string): Promise<GetOrderStatusResponse> {
    const order = await this.ordersRepo.getOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order '${id}' not found`);
    }
    const canRetry = order.status === 'out_of_stock' || order.status === 'delivery_failed';
    return {
      order_id: order.id,
      sku: order.sku,
      status: order.status,
      original_amount: Number(order.original_amount),
      discount_amount: Number(order.discount_amount),
      final_amount: Number(order.amount),
      currency: order.currency,
      key_code: order.key_code,
      provider_used: order.provider_used,
      error_message: order.error_message,
      can_retry: canRetry,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
