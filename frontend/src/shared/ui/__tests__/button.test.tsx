import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../button/button';

describe('Button Primitive', () => {
  it('renders children correctly', () => {
    render(<Button>Купить</Button>);
    expect(screen.getByRole('button', { name: /купить/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Нажать</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled or isLoading is set', () => {
    const { rerender } = render(<Button disabled>Заблокировано</Button>);
    expect(screen.getByRole('button')).toBeDisabled();

    rerender(<Button isLoading>Загрузка</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="accent">Акцент</Button>);
    expect(container.firstChild).toHaveClass('bg-emerald-600');
  });
});
