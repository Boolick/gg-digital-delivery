import React from 'react';
import { cn } from '../../../shared/lib/cn';

export interface CurrencySwitcherProps {
  activeCurrency?: 'USD' | 'KZT' | 'RUB';
  onChange?: (currency: 'USD' | 'KZT' | 'RUB') => void;
}

const CURRENCIES: { id: 'USD' | 'KZT' | 'RUB'; label: string }[] = [
  { id: 'USD', label: '$' },
  { id: 'KZT', label: '₸' },
  { id: 'RUB', label: '₽' },
];

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  activeCurrency = 'RUB',
  onChange,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Переключатель валют"
      className="inline-flex items-center p-1 bg-gray-200/70 rounded-lg border border-gray-300/50"
    >
      {CURRENCIES.map((curr) => {
        const isActive = curr.id === activeCurrency;
        return (
          <button
            key={curr.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(curr.id)}
            className={cn(
              'h-7 w-7 rounded-md text-xs font-bold transition-all duration-200 flex items-center justify-center',
              isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-600 hover:text-black hover:bg-gray-300/50',
            )}
          >
            {curr.label}
          </button>
        );
      })}
    </div>
  );
};
