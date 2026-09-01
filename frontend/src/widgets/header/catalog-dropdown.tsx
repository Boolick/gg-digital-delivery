import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ChevronDown, Gamepad2, CreditCard, Sparkles, Gift } from 'lucide-react';
import { cn } from '../../shared/lib/cn';

export interface CatalogCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  count: number;
}

const CATEGORIES: CatalogCategory[] = [
  {
    id: 'games',
    name: 'Игры и ключи',
    icon: <Gamepad2 className="h-4 w-4 text-emerald-600" />,
    count: 12,
  },
  {
    id: 'topup',
    name: 'Пополнение баланса',
    icon: <CreditCard className="h-4 w-4 text-blue-600" />,
    count: 8,
  },
  {
    id: 'subscriptions',
    name: 'Подписки',
    icon: <Sparkles className="h-4 w-4 text-amber-600" />,
    count: 5,
  },
  {
    id: 'gift_cards',
    name: 'Подарочные карты',
    icon: <Gift className="h-4 w-4 text-purple-600" />,
    count: 9,
  },
];

export interface CatalogDropdownProps {
  onSelectCategory?: ((categoryId: string) => void) | undefined;
}

export const CatalogDropdown: React.FC<CatalogDropdownProps> = ({ onSelectCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleCategoryClick = (id: string) => {
    setIsOpen(false);
    if (onSelectCategory) {
      onSelectCategory(id);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2.5 transition-all shadow-sm focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Каталог</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-2 z-50 animate-scale-in">
          <div className="text-xs font-semibold text-gray-400 px-3 py-1.5 uppercase tracking-wider">
            Категории товаров
          </div>
          <div className="space-y-1 mt-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  {cat.icon}
                  <span className="font-medium">{cat.name}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
