import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../ui/product-card';
import { Product } from '../model/types';

const mockProduct: Product = {
  sku: 'KEY-CS2-PRIME',
  name: 'CS2 Prime Status ключ',
  type: 'key',
  price: 1290,
  currency: 'RUB',
  image: 'assets/cs2.png',
};

describe('ProductCard Component', () => {
  it('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(/CS2 Prime Status ключ/i)).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toHaveTextContent('1 290 ₽');
  });

  it('triggers onBuy callback when card or button is clicked', () => {
    const handleBuy = vi.fn();
    render(<ProductCard product={mockProduct} onBuy={handleBuy} />);

    const buyButton = screen.getByRole('button', { name: /Купить/i });
    fireEvent.click(buyButton);

    expect(handleBuy).toHaveBeenCalledTimes(1);
    expect(handleBuy).toHaveBeenCalledWith(mockProduct);
  });

  it('triggers onBuy callback when card container is clicked', () => {
    const handleBuy = vi.fn();
    render(<ProductCard product={mockProduct} onBuy={handleBuy} />);

    const card = screen.getByTestId('product-card-KEY-CS2-PRIME');
    fireEvent.click(card);

    expect(handleBuy).toHaveBeenCalledTimes(1);
    expect(handleBuy).toHaveBeenCalledWith(mockProduct);
  });
});
