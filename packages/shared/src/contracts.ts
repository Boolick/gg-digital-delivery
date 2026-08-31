import { z } from 'zod';

// ==========================================
// 1. Common & Enum Types
// ==========================================

export const CurrencySchema = z.enum(['RUB', 'USD', 'KZT']);
export type Currency = z.infer<typeof CurrencySchema>;

export const ProductTypeSchema = z.enum(['topup', 'key', 'subscription', 'giftcard']);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const OrderStatusSchema = z.enum([
  'created',
  'paid',
  'delivering',
  'delivered',
  'payment_failed',
  'out_of_stock',
  'delivery_failed',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

/**
 * FSM_TRANSITIONS defines the allowed state machine transitions for OrderFsmService.
 * Any transition NOT in this matrix MUST be rejected by OrderFsmService.
 * Terminal states (delivered, payment_failed) have empty arrays — no exit.
 * BACK-01: Used by Phase 2 OrderFsmService implementation.
 */
export const FSM_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  created: ['paid', 'payment_failed'],
  paid: ['delivering'],
  delivering: ['delivered', 'out_of_stock', 'delivery_failed'],
  delivered: [],
  payment_failed: [],
  out_of_stock: ['delivering'],
  delivery_failed: ['delivering'],
} as const;

export function isValidFsmTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (FSM_TRANSITIONS[from] as readonly OrderStatus[]).includes(to);
}

export const ProviderUsedSchema = z.enum(['A', 'B']).optional();
export type ProviderUsed = z.infer<typeof ProviderUsedSchema>;

export const PromocodeTypeSchema = z.enum(['percent', 'amount']);
export type PromocodeType = z.infer<typeof PromocodeTypeSchema>;

// ==========================================
// 2. Catalog & Products
// ==========================================

export const ProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  type: ProductTypeSchema,
  price: z.number().positive('Price must be greater than 0'),
  currency: CurrencySchema.default('RUB'),
  image: z.string().min(1, 'Image path is required'),
});
export type Product = z.infer<typeof ProductSchema>;

export const CatalogResponseSchema = z.object({
  currency_note: z.string(),
  products: z.array(ProductSchema),
});
export type CatalogResponse = z.infer<typeof CatalogResponseSchema>;

// ==========================================
// 3. Orders & Checkout Flow
// ==========================================

export const CreateOrderRequestSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  email: z.string().email('Invalid email address').optional(),
  steam_login: z.string().optional(),
  promo_code: z.string().trim().toUpperCase().optional(),
});
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const CreateOrderResponseSchema = z.object({
  order_id: z.string().min(1),
  sku: z.string().min(1),
  status: OrderStatusSchema,
  original_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative(),
  final_amount: z.number().nonnegative(),
  currency: CurrencySchema,
  created_at: z.string(),
});
export type CreateOrderResponse = z.infer<typeof CreateOrderResponseSchema>;

export const OrderSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  status: OrderStatusSchema,
  amount: z.number().nonnegative(),
  original_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative().default(0),
  currency: CurrencySchema.default('RUB'),
  promo_code: z.string().optional(),
  key_code: z.string().optional(),
  provider_used: ProviderUsedSchema,
  error_message: z.string().optional(),
  delivery_attempts: z.number().int().nonnegative().default(0),
  email: z.string().email().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const GetOrderStatusResponseSchema = z.object({
  order_id: z.string().min(1),
  sku: z.string().min(1),
  product_name: z.string().optional(),
  status: OrderStatusSchema,
  original_amount: z.number().nonnegative(),
  discount_amount: z.number().nonnegative(),
  final_amount: z.number().nonnegative(),
  currency: CurrencySchema,
  key_code: z.string().optional(),
  provider_used: ProviderUsedSchema,
  error_message: z.string().optional(),
  can_retry: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type GetOrderStatusResponse = z.infer<typeof GetOrderStatusResponseSchema>;

// ==========================================
// 4. Payment Webhook Contract (ТЗ Standard)
// ==========================================

export const WEBHOOK_SIGNATURE_HEADER = 'x-webhook-signature';

export const PaymentWebhookPayloadSchema = z.object({
  event_id: z.string().min(1, 'event_id is required'),
  order_id: z.string().min(1, 'order_id is required'),
  status: z.enum(['paid', 'failed']),
  amount: z.number().nonnegative('amount must be non-negative'),
  currency: CurrencySchema.default('RUB'),
  created_at: z.string(),
});
export type PaymentWebhookPayload = z.infer<typeof PaymentWebhookPayloadSchema>;

export const PaymentWebhookResponseSchema = z.object({
  status: z.enum(['ok', 'ignored', 'error']),
  order_id: z.string(),
  event_id: z.string(),
  message: z.string().optional(),
});
export type PaymentWebhookResponse = z.infer<typeof PaymentWebhookResponseSchema>;

// ==========================================
// 5. Issue Providers Contract (A & Fallback B)
// ==========================================

export const IssueRequestSchema = z.object({
  request_id: z.string().min(1, 'request_id is required'),
  sku: z.string().min(1, 'sku is required'),
  order_id: z.string().min(1, 'order_id is required'),
});
export type IssueRequest = z.infer<typeof IssueRequestSchema>;

export const IssueResponseSuccessSchema = z.object({
  status: z.literal('ok'),
  request_id: z.string(),
  code: z.string().min(1),
});
export type IssueResponseSuccess = z.infer<typeof IssueResponseSuccessSchema>;

export const IssueErrorReasonSchema = z.enum([
  'out_of_stock',
  'timeout',
  'provider_error',
  'bad_request',
]);
export type IssueErrorReason = z.infer<typeof IssueErrorReasonSchema>;

export const IssueResponseErrorSchema = z.object({
  status: z.literal('error'),
  reason: IssueErrorReasonSchema,
  message: z.string().optional(),
});
export type IssueResponseError = z.infer<typeof IssueResponseErrorSchema>;

export const IssueResponseSchema = z.discriminatedUnion('status', [
  IssueResponseSuccessSchema,
  IssueResponseErrorSchema,
]);
export type IssueResponse = z.infer<typeof IssueResponseSchema>;

// ==========================================
// 6. Promocodes Engine Contract
// ==========================================

export const ValidatePromocodeRequestSchema = z.object({
  code: z.string().min(1, 'Code is required').trim().toUpperCase(),
  sku: z.string().min(1, 'SKU is required'),
  amount: z.number().positive('Amount must be positive'),
});
export type ValidatePromocodeRequest = z.infer<typeof ValidatePromocodeRequestSchema>;

export const ValidatePromocodeResponseSchema = z.object({
  valid: z.boolean(),
  code: z.string(),
  type: PromocodeTypeSchema.optional(),
  value: z.number().optional(),
  discount_amount: z.number().nonnegative(),
  final_amount: z.number().nonnegative(),
  reason: z.string().optional(),
});
export type ValidatePromocodeResponse = z.infer<typeof ValidatePromocodeResponseSchema>;

export const PromocodeEntitySchema = z.object({
  code: z.string().min(1),
  type: PromocodeTypeSchema,
  value: z.number().positive(),
  currency: CurrencySchema.optional(),
  max_uses: z.number().int().positive(),
  used_count: z.number().int().nonnegative(),
});
export type PromocodeEntity = z.infer<typeof PromocodeEntitySchema>;

// ==========================================
// 7. Admin & Manual Recovery Management
// ==========================================

export const AdminOrderListItemSchema = z.object({
  order_id: z.string(),
  sku: z.string(),
  product_name: z.string(),
  status: OrderStatusSchema,
  final_amount: z.number(),
  currency: CurrencySchema,
  created_at: z.string(),
  updated_at: z.string(),
  key_code: z.string().optional(),
  attempts: z.number().int().nonnegative(),
  error_message: z.string().optional(),
});
export type AdminOrderListItem = z.infer<typeof AdminOrderListItemSchema>;

export const AdminRetryDeliveryRequestSchema = z.object({
  order_id: z.string().min(1, 'order_id is required'),
});
export type AdminRetryDeliveryRequest = z.infer<typeof AdminRetryDeliveryRequestSchema>;

export const AdminRetryDeliveryResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  order_id: z.string(),
  new_status: OrderStatusSchema,
  key_code: z.string().optional(),
  message: z.string().optional(),
});
export type AdminRetryDeliveryResponse = z.infer<typeof AdminRetryDeliveryResponseSchema>;

export const AdminRestockKeysRequestSchema = z.object({
  sku: z.string().min(1, 'sku is required'),
  keys: z.array(z.string().min(1)).min(1, 'At least one key is required'),
});
export type AdminRestockKeysRequest = z.infer<typeof AdminRestockKeysRequestSchema>;

export const AdminRestockKeysResponseSchema = z.object({
  success: z.boolean(),
  sku: z.string(),
  added_count: z.number().int().nonnegative(),
  total_available: z.number().int().nonnegative(),
});
export type AdminRestockKeysResponse = z.infer<typeof AdminRestockKeysResponseSchema>;
