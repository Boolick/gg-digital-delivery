import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { CatalogResponse } from '@gg/shared';
import { CatalogService } from './catalog.service.js';

@Controller('api/catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  public async getCatalog(): Promise<CatalogResponse> {
    return this.catalogService.getCatalog();
  }
}
