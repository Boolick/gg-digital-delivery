import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BannerCarousel } from '../banner-carousel';

describe('BannerCarousel Component', () => {
  it('renders initial slide correctly', () => {
    render(<BannerCarousel />);
    expect(screen.getByText('Counter-Strike 2 Prime')).toBeInTheDocument();
  });

  it('navigates to next slide on next arrow click', async () => {
    const user = userEvent.setup();
    render(<BannerCarousel />);
    const nextBtn = screen.getByLabelText('Следующий слайд');
    await user.click(nextBtn);
    expect(screen.getByText('GTA V: Premium Edition')).toBeInTheDocument();
  });

  it('auto-rotates slides after 5 seconds', () => {
    vi.useFakeTimers();
    render(<BannerCarousel />);
    expect(screen.getByText('Counter-Strike 2 Prime')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('GTA V: Premium Edition')).toBeInTheDocument();
    vi.useRealTimers();
  });
});
