import { Module } from '@nestjs/common';
import { ProviderAService } from './provider-a.service.js';
import { ProviderBService } from './provider-b.service.js';
import { IssueEngineService } from './issue-engine.service.js';

@Module({
  providers: [ProviderAService, ProviderBService, IssueEngineService],
  exports: [ProviderAService, ProviderBService, IssueEngineService],
})
export class ProvidersModule {}
