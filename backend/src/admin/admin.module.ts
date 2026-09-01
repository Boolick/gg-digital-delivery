import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { KeysModule } from '../keys/keys.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { FsmModule } from '../fsm/fsm.module.js';

@Module({
  imports: [KeysModule, OrdersModule, FsmModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
