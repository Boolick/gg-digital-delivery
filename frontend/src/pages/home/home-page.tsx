import React, { useState } from 'react';
import { SEED_PRODUCTS, Product } from '@gg/shared';
import { Header } from '../../widgets/header';
import { BannerCarousel } from '../../widgets/banner-carousel';
import { ServiceGrid } from '../../widgets/service-grid';
import { SteamTopupWidget } from '../../widgets/steam-topup';
import { ProductCatalog } from '../../widgets/product-catalog';

export interface HomePageProps {
  onBuyProduct?: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onBuyProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const allProducts = SEED_PRODUCTS as unknown as Product[];
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col">
      {/* Top Navbar Header */}
      <Header onSearchChange={setSearchQuery} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* Hero Banner Carousel */}
        <BannerCarousel />

        {/* Gaming Service Quick Icons Row */}
        <ServiceGrid />

        {/* Steam Wallet Topup Interactive Widget Block */}
        <SteamTopupWidget />

        {/* Product Catalog Grid */}
        <ProductCatalog
          products={filteredProducts.length > 0 ? filteredProducts : allProducts}
          onBuyProduct={onBuyProduct}
        />
      </main>
    </div>
  );
};
