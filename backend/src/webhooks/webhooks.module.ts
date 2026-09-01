import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller.js';
import { WebhooksService } from './webhooks.service.js';
import { OrdersModule } from '../orders/orders.module.js';
import { KeysModule } from '../keys/keys.module.js';
import { ProvidersModule } from '../providers/providers.module.js';
import { FsmModule } from '../fsm/fsm.module.js';

@Module({
  imports: [OrdersModule, KeysModule, ProvidersModule, FsmModule],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
