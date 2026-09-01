import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { SeedService } from './seed.service.js';

@Global()
@Module({
  providers: [DatabaseService, SeedService],
  exports: [DatabaseService, SeedService],
})
export class DatabaseModule {}
