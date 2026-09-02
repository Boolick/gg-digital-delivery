import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PurchaseModal } from '../purchase-modal';
import * as promoApi from '../../../entities/promocode/api/promocode-api';
import * as orderApi from '../../../entities/order/api/orders-api';
import { Product } from '../../../entities/product';

const mockProduct: Product = {
  sku: 'KEY-CS2-PRIME',
  name: 'CS2 Prime Status',
  type: 'key',
  price: 1290,
  currency: 'RUB',
  image: 'assets/cs2.png',
};

describe('PurchaseModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details and initial price', () => {
    render(
      <PurchaseModal isOpen={true} product={mockProduct} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    expect(screen.getByText(/CS2 Prime Status/i)).toBeInTheDocument();
    expect(screen.getByTestId('modal-final-price')).toHaveTextContent('1290 ₽');
  });

  it('applies promocode discount when valid promo is submitted', async () => {
    vi.spyOn(promoApi, 'validatePromocode').mockResolvedValueOnce({
      valid: true,
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      discount_amount: 129,
      final_amount: 1161,
    });

    render(
      <PurchaseModal isOpen={true} product={mockProduct} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );

    const promoInput = screen.getByPlaceholderText(/Введите промокод/i);
    const applyButton = screen.getByRole('button', { name: /Применить/i });

    fireEvent.change(promoInput, { target: { value: 'WELCOME10' } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/Скидка 129 ₽ применена/i)).toBeInTheDocument();
      expect(screen.getByTestId('modal-final-price')).toHaveTextContent('1161 ₽');
    });
  });

  it('creates order and triggers mock payment on checkout button click', async () => {
    const handleSuccess = vi.fn();
    vi.spyOn(orderApi, 'createOrder').mockResolvedValueOnce({
      order_id: 'ord_123',
      sku: 'KEY-CS2-PRIME',
      status: 'created',
      original_amount: 1290,
      discount_amount: 0,
      final_amount: 1290,
      currency: 'RUB',
      created_at: new Date().toISOString(),
    });
    vi.spyOn(orderApi, 'triggerMockPayment').mockResolvedValueOnce({
      status: 'ok',
      order_id: 'ord_123',
      event_id: 'evt_1',
    });

    render(
      <PurchaseModal
        isOpen={true}
        product={mockProduct}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />,
    );

    const checkoutBtn = screen.getByTestId('checkout-submit-btn');
    fireEvent.click(checkoutBtn);

    await waitFor(() => {
      expect(orderApi.createOrder).toHaveBeenCalledTimes(1);
      expect(orderApi.triggerMockPayment).toHaveBeenCalledWith('ord_123', 1290);
      expect(handleSuccess).toHaveBeenCalledWith('ord_123');
    });
  });
});
