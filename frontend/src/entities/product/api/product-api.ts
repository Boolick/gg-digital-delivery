import { SEED_PRODUCTS, Product, CatalogResponseSchema } from '@gg/shared';
import { CatalogResponse } from '../model/types';
import { apiClient } from '../../../shared/api';

export async function fetchCatalog(): Promise<CatalogResponse> {
  try {
    const data = await apiClient.get('/api/catalog', CatalogResponseSchema, {
      skipGlobalError: true,
    });
    return {
      items: data.products as Product[],
      total: data.products.length,
    };
  } catch {
    return {
      items: SEED_PRODUCTS as unknown as Product[],
      total: SEED_PRODUCTS.length,
    };
  }
}
