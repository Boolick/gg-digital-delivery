import {
  AdminOrderListItem,
  AdminRetryDeliveryResponse,
  AdminRetryDeliveryResponseSchema,
  AdminRestockKeysResponse,
  AdminRestockKeysResponseSchema,
} from '@gg/shared';
import { apiClient } from '../../../shared/api';

export async function fetchAdminOrders(token: string): Promise<AdminOrderListItem[]> {
  return apiClient.get<AdminOrderListItem[]>('/api/admin/orders', undefined, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function retryOrderDelivery(
  token: string,
  orderId: string,
): Promise<AdminRetryDeliveryResponse> {
  return apiClient.post(
    `/api/admin/orders/${encodeURIComponent(orderId)}/retry-delivery`,
    {},
    AdminRetryDeliveryResponseSchema,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function restockProductKeys(
  token: string,
  sku: string,
  keys: string[],
): Promise<AdminRestockKeysResponse> {
  return apiClient.post('/api/admin/keys/restock', { sku, keys }, AdminRestockKeysResponseSchema, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
