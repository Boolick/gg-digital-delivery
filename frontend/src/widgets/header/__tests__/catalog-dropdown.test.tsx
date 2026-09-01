import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CatalogDropdown } from '../catalog-dropdown';

describe('CatalogDropdown Component', () => {
  it('opens category list on button click', async () => {
    render(<CatalogDropdown />);
    const trigger = screen.getByRole('button', { name: /каталог/i });
    expect(screen.queryByText('Категории товаров')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByText('Категории товаров')).toBeInTheDocument();
    expect(screen.getByText('Игры и ключи')).toBeInTheDocument();
  });

  it('triggers onSelectCategory when a category is selected', async () => {
    const handleSelect = vi.fn();
    render(<CatalogDropdown onSelectCategory={handleSelect} />);
    const trigger = screen.getByRole('button', { name: /каталог/i });
    await userEvent.click(trigger);

    const categoryItem = screen.getByText('Игры и ключи');
    await userEvent.click(categoryItem);

    expect(handleSelect).toHaveBeenCalledWith('games');
    expect(screen.queryByText('Категории товаров')).not.toBeInTheDocument();
  });
});
