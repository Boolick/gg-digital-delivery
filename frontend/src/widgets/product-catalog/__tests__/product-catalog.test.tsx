import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCatalog } from '../product-catalog';
import { Product } from '../../../entities/product';

const mockProducts: Product[] = [
  {
    sku: 'STEAM-TOPUP-500',
    name: 'Steam Topup 500',
    type: 'topup',
    price: 500,
    currency: 'RUB',
    image: 'assets/steam.png',
  },
  {
    sku: 'KEY-CS2',
    name: 'CS2 Key',
    type: 'key',
    price: 1290,
    currency: 'RUB',
    image: 'assets/cs2.png',
  },
  {
    sku: 'SUB-SPOTIFY',
    name: 'Spotify 1M',
    type: 'subscription',
    price: 299,
    currency: 'RUB',
    image: 'assets/spotify.png',
  },
];

describe('ProductCatalog Component', () => {
  it('renders all products when "Все" category is selected', () => {
    render(<ProductCatalog products={mockProducts} />);

    expect(screen.getByText(/Steam Topup 500/i)).toBeInTheDocument();
    expect(screen.getByText(/CS2 Key/i)).toBeInTheDocument();
    expect(screen.getByText(/Spotify 1M/i)).toBeInTheDocument();
  });

  it('filters products when specific category is clicked', () => {
    render(<ProductCatalog products={mockProducts} />);

    const keysTab = screen.getByRole('tab', { name: /Ключи/i });
    fireEvent.click(keysTab);

    expect(screen.getByText(/CS2 Key/i)).toBeInTheDocument();
    expect(screen.queryByText(/Steam Topup 500/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Spotify 1M/i)).not.toBeInTheDocument();
  });

  it('passes onBuyProduct callback to ProductCard', () => {
    const handleBuy = vi.fn();
    render(<ProductCatalog products={mockProducts} onBuyProduct={handleBuy} />);

    const buyButtons = screen.getAllByRole('button', { name: /Купить/i });
    expect(buyButtons.length).toBeGreaterThan(0);
    fireEvent.click(buyButtons[0] as HTMLElement);

    expect(handleBuy).toHaveBeenCalledWith(mockProducts[0]);
  });
});
