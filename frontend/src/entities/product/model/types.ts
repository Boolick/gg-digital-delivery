import { Product, ProductType, Currency } from '@gg/shared';

export type { Product, ProductType, Currency };

export type CategoryFilter =
  'all' | 'donat' | 'subscriptions' | 'items' | 'accounts' | 'keys' | 'currency' | 'other';

export interface CatalogResponse {
  items: Product[];
  total: number;
}
