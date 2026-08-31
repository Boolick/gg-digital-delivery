import React from 'react';
import { SEED_PRODUCTS } from '@gg/shared';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-gray-100">
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">GG Digital Delivery</h1>
          <span className="text-xs bg-surface px-2 py-1 rounded border border-gray-700">
            FSD Ready &bull; React 19
          </span>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-4">
        <div className="bg-surface p-6 rounded-lg border border-gray-800">
          <h2 className="text-lg font-semibold mb-2">Spec-First Architecture</h2>
          <p className="text-gray-400 text-sm mb-4">
            Каталог загружен из единого Zod-контракта (@gg/shared). Всего товаров:{' '}
            {SEED_PRODUCTS.length}
          </p>
        </div>
      </main>
    </div>
  );
};
