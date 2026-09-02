import React from 'react';
import { Product } from '../model/types';

export interface ProductCardProps {
  product: Product;
  onBuy?: ((product: Product) => void) | undefined;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const originalPrice = Math.round(product.price * 1.4);

  return (
    <div
      data-testid={`product-card-${product.sku}`}
      onClick={() => onBuy?.(product)}
      className="group bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Game Cover Image */}
        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 mb-3 relative">
          <img
            src={product.image || 'https://placehold.co/400x300/111827/FFFFFF?text=GG+Game'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://placehold.co/400x300/111827/FFFFFF?text=GG+Goods';
            }}
          />
        </div>

        {/* Product Name / Badge */}
        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[32px] mb-2 leading-tight">
          💥 {product.name} 🔑 РФ+СНГ
        </h3>
      </div>

      {/* Price Row & Buy CTA Button */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-emerald-600 font-extrabold text-lg" data-testid="product-price">
            {product.price.toLocaleString('ru-RU')} ₽
          </span>
          <span className="text-gray-400 text-xs line-through">
            {originalPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.(product);
          }}
          className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 rounded-xl text-sm transition-colors shadow-sm"
        >
          Купить
        </button>
      </div>
    </div>
  );
};
