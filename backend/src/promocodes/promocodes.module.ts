import { Module } from '@nestjs/common';
import { PromocodesController } from './promocodes.controller.js';
import { PromocodesService } from './promocodes.service.js';
import { PromocodesRepository } from './promocodes.repository.js';

@Module({
  controllers: [PromocodesController],
  providers: [PromocodesService, PromocodesRepository],
  exports: [PromocodesService, PromocodesRepository],
})
export class PromocodesModule {}
