import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  AdminRestockKeysRequest,
  AdminRestockKeysResponse,
  AdminRetryDeliveryResponse,
  AdminOrderListItem,
} from '@gg/shared';
import { DatabaseService } from '../database/database.service.js';
import { KeysRepository } from '../keys/keys.repository.js';
import { OrdersRepository } from '../orders/orders.repository.js';
import { OrderFsmService } from '../fsm/order-fsm.service.js';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly keysRepo: KeysRepository,
    private readonly ordersRepo: OrdersRepository,
    private readonly fsm: OrderFsmService,
  ) {}

  public async restockKeys(dto: AdminRestockKeysRequest): Promise<AdminRestockKeysResponse> {
    const added = await this.keysRepo.restockKeys(dto.sku, dto.keys);
    const total = await this.keysRepo.getAvailableKeysCount(dto.sku);
    return { success: true, sku: dto.sku, added_count: added, total_available: total };
  }

  public async retryDelivery(orderId: string): Promise<AdminRetryDeliveryResponse> {
    return this.db.transaction(async (client) => {
      const order = await this.ordersRepo.lockOrderForUpdate(client, orderId);
      if (!order) {
        throw new NotFoundException(`Order '${orderId}' not found`);
      }

      this.fsm.transition(order.status, 'delivering', order.id);
      const allocatedKey = await this.keysRepo.allocateKeyForOrder(client, order.sku, order.id);

      if (allocatedKey) {
        this.fsm.transition('delivering', 'delivered', order.id);
        await this.ordersRepo.updateOrderStatus(
          client,
          order.id,
          'delivered',
          allocatedKey.key_code,
        );
        this.logger.log(`Admin retry delivered key for order ${order.id}`);
        return {
          status: 'ok',
          order_id: order.id,
          new_status: 'delivered',
          key_code: allocatedKey.key_code,
        };
      }

      this.fsm.transition('delivering', 'out_of_stock', order.id);
      await this.ordersRepo.updateOrderStatus(
        client,
        order.id,
        'out_of_stock',
        undefined,
        'No keys in pool',
      );
      return {
        status: 'error',
        order_id: order.id,
        new_status: 'out_of_stock',
        message: 'Pool still empty',
      };
    });
  }

  public async listProblematicOrders(): Promise<AdminOrderListItem[]> {
    return this.ordersRepo.findProblematicOrders();
  }
}
