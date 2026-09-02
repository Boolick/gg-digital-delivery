import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CurrencySwitcher } from '../ui/currency-switcher';

describe('CurrencySwitcher Component', () => {
  it('renders all currency options', () => {
    render(<CurrencySwitcher activeCurrency="RUB" />);

    expect(screen.getByRole('tab', { name: '$' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '₸' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '₽' })).toBeInTheDocument();
  });

  it('indicates active currency correctly', () => {
    render(<CurrencySwitcher activeCurrency="USD" />);

    const usdTab = screen.getByRole('tab', { name: '$' });
    const rubTab = screen.getByRole('tab', { name: '₽' });

    expect(usdTab).toHaveAttribute('aria-selected', 'true');
    expect(rubTab).toHaveAttribute('aria-selected', 'false');
  });

  it('triggers onChange when a currency tab is clicked', () => {
    const handleChange = vi.fn();
    render(<CurrencySwitcher activeCurrency="RUB" onChange={handleChange} />);

    const kztTab = screen.getByRole('tab', { name: '₸' });
    fireEvent.click(kztTab);

    expect(handleChange).toHaveBeenCalledWith('KZT');
  });
});
