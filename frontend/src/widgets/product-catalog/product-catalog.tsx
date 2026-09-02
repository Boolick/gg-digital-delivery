import React, { useState } from 'react';
import { Product } from '../../entities/product';
import { ProductCard } from '../../entities/product/ui/product-card';
import { Gamepad2, Sparkles, Key, Package, Layers } from 'lucide-react';

export interface ProductCatalogProps {
  products: Product[];
  onBuyProduct?: ((product: Product) => void) | undefined;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Все', icon: <Layers className="h-3.5 w-3.5" /> },
  { id: 'donat', label: 'Донат', icon: <Gamepad2 className="h-3.5 w-3.5" /> },
  { id: 'subscriptions', label: 'Подписки', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { id: 'keys', label: 'Ключи', icon: <Key className="h-3.5 w-3.5" /> },
  { id: 'giftcards', label: 'Подарочные карты', icon: <Package className="h-3.5 w-3.5" /> },
];

export const ProductCatalog: React.FC<ProductCatalogProps> = ({ products, onBuyProduct }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const displayedProducts = products.filter((prod) => {
    if (activeCategory === 'all') {
      return true;
    }
    if (activeCategory === 'donat') {
      return prod.type === 'topup';
    }
    if (activeCategory === 'subscriptions') {
      return prod.type === 'subscription';
    }
    if (activeCategory === 'keys') {
      return prod.type === 'key';
    }
    if (activeCategory === 'giftcards') {
      return prod.type === 'giftcard';
    }
    return true;
  });

  return (
    <div className="space-y-5" data-testid="product-catalog">
      {/* Section Title & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Популярные товары</h2>

        {/* Category Pill Switchers */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none"
          role="tablist"
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = tab.id === activeCategory;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayedProducts.map((prod) => (
          <ProductCard key={prod.sku} product={prod} onBuy={onBuyProduct} />
        ))}
      </div>
    </div>
  );
};
