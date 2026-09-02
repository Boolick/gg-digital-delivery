import { useNavigate } from 'react-router-dom';
import { Search, Heart, User, ShieldCheck } from 'lucide-react';
import { CatalogDropdown } from './catalog-dropdown';

export interface HeaderProps {
  onSearchChange?: (query: string) => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchChange, onSelectCategory }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Catalog Dropdown Trigger */}
        <div className="flex items-center gap-4">
          <CatalogDropdown onSelectCategory={onSelectCategory} />
        </div>

        {/* Center: Search Bar matching Figma */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Игра, приложение или услуга..."
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-10 pl-4 pr-20 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            <div className="absolute right-1.5 flex items-center gap-1.5">
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Избранное"
              >
                <Heart className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="bg-black text-white p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                aria-label="Поиск"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Admin Panel & User Profile Icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="h-10 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-semibold"
            title="Панель администратора"
            data-testid="header-admin-link"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Админка</span>
          </button>
          <button
            type="button"
            className="h-10 w-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl flex items-center justify-center transition-colors"
            aria-label="Профиль пользователя"
          >
            <User className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
