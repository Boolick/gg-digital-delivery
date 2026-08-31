import { describe, it, expect } from 'vitest';
import {
  PaymentWebhookPayloadSchema,
  IssueRequestSchema,
  IssueResponseSchema,
  ValidatePromocodeRequestSchema,
  CreateOrderRequestSchema,
  CatalogResponseSchema,
  isValidOrderTransition,
  SEED_PRODUCTS,
  SEED_KEYS,
  SEED_PROMOCODES,
} from '../index.js';

describe('Shared Contracts & Schemas', () => {
  describe('Catalog & Seed Data', () => {
    it('should validate the canonical catalog response', () => {
      const result = CatalogResponseSchema.safeParse({
        currency_note: 'Demo note',
        products: SEED_PRODUCTS,
      });
      expect(result.success).toBe(true);
      expect(SEED_PRODUCTS.length).toBe(12);
    });

    it('should have 50 canonical seed keys', () => {
      expect(SEED_KEYS.length).toBe(50);
      expect(SEED_KEYS[0]).toBe('LFXC-TNCS-BPCD');
    });

    it('should have 4 canonical promocodes', () => {
      expect(SEED_PROMOCODES.length).toBe(4);
    });
  });

  describe('Order Creation & Validation', () => {
    it('should parse valid order creation request', () => {
      const valid = CreateOrderRequestSchema.safeParse({
        sku: 'KEY-CS2-PRIME',
        email: 'user@example.com',
        promo_code: 'welcome10',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.promo_code).toBe('WELCOME10'); // upper-cased
      }
    });

    it('should reject invalid email if provided', () => {
      const invalid = CreateOrderRequestSchema.safeParse({
        sku: 'KEY-CS2-PRIME',
        email: 'not-an-email',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('Payment Webhook Contract', () => {
    it('should validate valid payment webhook payload', () => {
      const payload = {
        event_id: 'evt_a1b2c3',
        order_id: 'ord_00123',
        status: 'paid' as const,
        amount: 500,
        currency: 'RUB' as const,
        created_at: '2025-01-01T12:00:00Z',
      };
      const result = PaymentWebhookPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should reject webhook payload with invalid status', () => {
      const payload = {
        event_id: 'evt_a1b2c3',
        order_id: 'ord_00123',
        status: 'pending',
        amount: 500,
        currency: 'RUB',
        created_at: '2025-01-01T12:00:00Z',
      };
      const result = PaymentWebhookPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('Issue Provider Contract', () => {
    it('should validate issue request', () => {
      const req = {
        request_id: 'req_00123-1',
        sku: 'STEAM-TOPUP-500',
        order_id: 'ord_00123',
      };
      const result = IssueRequestSchema.safeParse(req);
      expect(result.success).toBe(true);
    });

    it('should validate issue success response', () => {
      const res = {
        status: 'ok' as const,
        request_id: 'req_00123-1',
        code: 'LFXC-TNCS-BPCD',
      };
      const result = IssueResponseSchema.safeParse(res);
      expect(result.success).toBe(true);
    });

    it('should validate issue error response', () => {
      const res = {
        status: 'error' as const,
        reason: 'out_of_stock' as const,
      };
      const result = IssueResponseSchema.safeParse(res);
      expect(result.success).toBe(true);
    });
  });

  describe('Promocode Validation', () => {
    it('should validate valid promocode request', () => {
      const req = {
        code: 'gg500',
        sku: 'STEAM-TOPUP-1000',
        amount: 1000,
      };
      const result = ValidatePromocodeRequestSchema.safeParse(req);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.code).toBe('GG500');
      }
    });
  });

  describe('FSM Transitions', () => {
    it('should permit valid transitions', () => {
      expect(isValidOrderTransition('created', 'paid')).toBe(true);
      expect(isValidOrderTransition('paid', 'delivering')).toBe(true);
      expect(isValidOrderTransition('delivering', 'delivered')).toBe(true);
      expect(isValidOrderTransition('delivering', 'out_of_stock')).toBe(true);
      expect(isValidOrderTransition('out_of_stock', 'delivering')).toBe(true);
    });

    it('should forbid invalid transitions', () => {
      expect(isValidOrderTransition('created', 'delivered')).toBe(false);
      expect(isValidOrderTransition('delivered', 'delivering')).toBe(false);
      expect(isValidOrderTransition('payment_failed', 'delivered')).toBe(false);
    });
  });
});
