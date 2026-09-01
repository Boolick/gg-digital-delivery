import { Module } from '@nestjs/common';
import { KeysRepository } from './keys.repository.js';
import { KeysService } from './keys.service.js';

@Module({
  providers: [KeysRepository, KeysService],
  exports: [KeysRepository, KeysService],
})
export class KeysModule {}
