import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderStatusPage } from '../order-status-page';
import * as orderApi from '../../../entities/order/api/orders-api';

describe('OrderStatusPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders order status and polls until delivered', async () => {
    vi.spyOn(orderApi, 'getOrderStatus').mockResolvedValue({
      order_id: 'ord_test_999',
      sku: 'KEY-CS2-PRIME',
      product_name: 'CS2 Prime Status',
      status: 'delivered',
      original_amount: 1290,
      discount_amount: 0,
      final_amount: 1290,
      currency: 'RUB',
      key_code: 'TEST-KEY-1234-ABCD',
      can_retry: false,
      created_at: '2026-09-01T12:00:00.000Z',
      updated_at: '2026-09-01T12:00:01.000Z',
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/order/ord_test_999']}>
          <Routes>
            <Route path="/order/:id" element={<OrderStatusPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/CS2 Prime Status/i)).toBeInTheDocument();
      expect(screen.getByText('TEST-KEY-1234-ABCD')).toBeInTheDocument();
      expect(screen.getByText(/Выдан/i)).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId('copy-key-button');
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TEST-KEY-1234-ABCD');
  });

  it('displays out of stock warning when status is out_of_stock', async () => {
    vi.spyOn(orderApi, 'getOrderStatus').mockResolvedValue({
      order_id: 'ord_stock_000',
      sku: 'KEY-CS2-PRIME',
      status: 'out_of_stock',
      original_amount: 1290,
      discount_amount: 0,
      final_amount: 1290,
      currency: 'RUB',
      can_retry: true,
      created_at: '2026-09-01T12:00:00.000Z',
      updated_at: '2026-09-01T12:00:01.000Z',
    });

    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/order/ord_stock_000']}>
          <Routes>
            <Route path="/order/:id" element={<OrderStatusPage />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Товар временно ожидает пополнения/i)).toBeInTheDocument();
    });
  });
});
