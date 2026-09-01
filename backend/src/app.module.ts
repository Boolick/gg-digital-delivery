import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { SeedService } from './database/seed.service.js';
import { FsmModule } from './fsm/fsm.module.js';
import { KeysModule } from './keys/keys.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';
import { ProvidersModule } from './providers/providers.module.js';
import { PromocodesModule } from './promocodes/promocodes.module.js';
import { AdminModule } from './admin/admin.module.js';
import { CatalogModule } from './catalog/catalog.module.js';

@Module({
  imports: [
    DatabaseModule,
    FsmModule,
    KeysModule,
    OrdersModule,
    WebhooksModule,
    ProvidersModule,
    PromocodesModule,
    AdminModule,
    CatalogModule,
  ],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly seedService: SeedService) {}

  public async onApplicationBootstrap(): Promise<void> {
    await this.seedService.seedDatabaseIfEmpty();
  }
}
