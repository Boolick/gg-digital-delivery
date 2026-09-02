import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminPage } from '../admin-page';
import * as adminApi from '../../../entities/admin/api/admin-api';
import { AdminOrderListItem } from '@gg/shared';

const mockProblematicOrders: AdminOrderListItem[] = [
  {
    order_id: 'ord_problem_01',
    sku: 'KEY-CS2-PRIME',
    product_name: 'CS2 Prime Status',
    status: 'out_of_stock',
    final_amount: 1290,
    currency: 'RUB',
    attempts: 1,
    error_message: 'No keys available in pool',
    created_at: '2026-09-01T12:00:00.000Z',
    updated_at: '2026-09-01T12:00:05.000Z',
  },
];

describe('AdminPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders admin dashboard and lists problematic orders', async () => {
    vi.spyOn(adminApi, 'fetchAdminOrders').mockResolvedValueOnce(mockProblematicOrders);

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Панель администратора/i)).toBeInTheDocument();
      expect(screen.getByText(/ord_problem_/i)).toBeInTheDocument();
      expect(screen.getByText(/No keys available in pool/i)).toBeInTheDocument();
    });
  });

  it('triggers delivery retry when Retry button is clicked', async () => {
    vi.spyOn(adminApi, 'fetchAdminOrders').mockResolvedValue(mockProblematicOrders);
    vi.spyOn(adminApi, 'retryOrderDelivery').mockResolvedValueOnce({
      status: 'ok',
      order_id: 'ord_problem_01',
      new_status: 'delivered',
      key_code: 'NEW-RESTOCKED-KEY',
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('retry-btn-ord_problem_01')).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId('retry-btn-ord_problem_01');
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(adminApi.retryOrderDelivery).toHaveBeenCalledWith(
        expect.any(String),
        'ord_problem_01',
      );
      expect(screen.getByText(/повторно отправлен/i)).toBeInTheDocument();
    });
  });

  it('submits restock keys form and updates pool', async () => {
    vi.spyOn(adminApi, 'fetchAdminOrders').mockResolvedValue(mockProblematicOrders);
    vi.spyOn(adminApi, 'restockProductKeys').mockResolvedValueOnce({
      success: true,
      sku: 'KEY-CS2-PRIME',
      added_count: 2,
      total_available: 2,
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    );

    const textarea = screen.getByPlaceholderText(/ABCD-1234-EFGH/i);
    const form = screen.getByTestId('admin-restock-form');

    fireEvent.change(textarea, { target: { value: 'KEY-111\nKEY-222' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(adminApi.restockProductKeys).toHaveBeenCalledWith(
        expect.any(String),
        'KEY-CS2-PRIME',
        ['KEY-111', 'KEY-222'],
      );
      expect(screen.getByText(/Добавлено 2 ключей/i)).toBeInTheDocument();
    });
  });
});
