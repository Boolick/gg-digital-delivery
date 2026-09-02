import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEED_PRODUCTS, Product } from '@gg/shared';
import { Header } from '../../widgets/header';
import { BannerCarousel } from '../../widgets/banner-carousel';
import { ServiceGrid } from '../../widgets/service-grid';
import { SteamTopupWidget } from '../../widgets/steam-topup';
import { ProductCatalog } from '../../widgets/product-catalog';
import { PurchaseModal } from '../../widgets/purchase-modal';

export interface HomePageProps {
  onBuyProduct?: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onBuyProduct }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const allProducts = SEED_PRODUCTS as unknown as Product[];
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleBuy = (product: Product) => {
    setSelectedProduct(product);
    onBuyProduct?.(product);
  };

  const handleSteamTopup = (_account: string, amount: number) => {
    const steamProd =
      allProducts.find((p) => p.type === 'topup' && p.price === amount) ||
      allProducts.find((p) => p.type === 'topup') ||
      allProducts[0];
    if (steamProd) {
      setSelectedProduct(steamProd);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-900 flex flex-col">
      <Header onSearchChange={setSearchQuery} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        <BannerCarousel />
        <ServiceGrid />
        <SteamTopupWidget onBuyTopup={handleSteamTopup} />
        <ProductCatalog
          products={filteredProducts.length > 0 ? filteredProducts : allProducts}
          onBuyProduct={handleBuy}
        />
      </main>

      <PurchaseModal
        isOpen={selectedProduct !== null}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSuccess={(orderId) => {
          setSelectedProduct(null);
          navigate(`/order/${orderId}`);
        }}
      />
    </div>
  );
};
