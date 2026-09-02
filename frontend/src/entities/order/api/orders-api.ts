import {
  CreateOrderRequest,
  CreateOrderResponse,
  CreateOrderResponseSchema,
  GetOrderStatusResponse,
  GetOrderStatusResponseSchema,
  PaymentWebhookResponse,
  PaymentWebhookResponseSchema,
} from '@gg/shared';
import { apiClient } from '../../../shared/api';

export async function createOrder(req: CreateOrderRequest): Promise<CreateOrderResponse> {
  return apiClient.post('/api/orders', req, CreateOrderResponseSchema);
}

export async function getOrderStatus(orderId: string): Promise<GetOrderStatusResponse> {
  return apiClient.get(`/api/orders/${encodeURIComponent(orderId)}`, GetOrderStatusResponseSchema);
}

export async function triggerMockPayment(
  orderId: string,
  amount: number,
): Promise<PaymentWebhookResponse> {
  const eventId = `evt_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return apiClient.post(
    '/api/webhooks/payment',
    {
      event_id: eventId,
      order_id: orderId,
      status: 'paid',
      amount,
      currency: 'RUB',
      created_at: new Date().toISOString(),
    },
    PaymentWebhookResponseSchema,
    {
      headers: {
        'x-bypass-signature': 'dev-secret',
      },
    },
  );
}
