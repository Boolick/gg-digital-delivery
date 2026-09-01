import React, { useState } from 'react';
import { User, Wallet } from 'lucide-react';
import { CurrencySwitcher } from '../../features/switch-currency/ui/currency-switcher';
import { SteamIcon } from '../../shared/ui/icons';
export interface SteamTopupWidgetProps {
  onBuyTopup?: (account: string, amount: number, currency: string) => void;
}

export const SteamTopupWidget: React.FC<SteamTopupWidgetProps> = ({ onBuyTopup }) => {
  const [steamAccount, setSteamAccount] = useState('');
  const [amount] = useState<number>(500);
  const [activeCurrency, setActiveCurrency] = useState<'USD' | 'KZT' | 'RUB'>('RUB');

  const handlePay = () => {
    onBuyTopup?.(steamAccount || 'demo_user', amount, activeCurrency);
  };

  const currencySymbols = {
    USD: '$',
    KZT: '₸',
    RUB: '₽',
  };
  const currencySymbol = currencySymbols[activeCurrency];

  return (
    <div className="w-full bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Left: Title, Discount Badge & Promo Link */}
      <div className="flex items-center gap-3.5 min-w-max">
        <div className="h-14 w-14 flex items-center justify-center flex-shrink-0">
          <SteamIcon className="h-14 w-14 object-contain" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-base">Пополнение Steam</span>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              5%
            </span>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            Ввести промокод ˅
          </button>
        </div>
      </div>

      {/* Middle 1: Steam Login Input */}
      <div className="flex-1 max-w-xs w-full">
        <div className="relative flex items-center">
          <User className="absolute left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={steamAccount}
            onChange={(e) => setSteamAccount(e.target.value)}
            placeholder="Логин Steam"
            className="w-full h-11 pl-9 pr-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Middle 2: Amount & Currency Switcher matching Figma */}
      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 px-3">
          <Wallet className="h-4 w-4 text-gray-400" />
          <div className="text-xs text-gray-500">
            Сумма: <span className="font-bold text-gray-900 text-sm">{amount} ₽</span>
          </div>
        </div>
        {/* Currency Switcher (UI-04) */}
        <CurrencySwitcher activeCurrency={activeCurrency} onChange={setActiveCurrency} />
      </div>

      {/* Right: Black Pay CTA Button */}
      <button
        onClick={handlePay}
        className="w-full lg:w-auto bg-black hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all shadow-sm focus:outline-none min-w-[140px]"
      >
        Оплатить {amount}
        {currencySymbol}
      </button>
    </div>
  );
};
