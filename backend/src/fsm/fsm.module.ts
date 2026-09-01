import { Module } from '@nestjs/common';
import { OrderFsmService } from './order-fsm.service.js';

@Module({
  providers: [OrderFsmService],
  exports: [OrderFsmService],
})
export class FsmModule {}
