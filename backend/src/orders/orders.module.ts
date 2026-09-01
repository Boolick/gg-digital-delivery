import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { OrdersRepository } from './orders.repository.js';
import { FsmModule } from '../fsm/fsm.module.js';
import { PromocodesModule } from '../promocodes/promocodes.module.js';

@Module({
  imports: [FsmModule, PromocodesModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
export class OrdersModule {}
