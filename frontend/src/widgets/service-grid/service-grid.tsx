import React from 'react';
import {
  SteamIcon,
  TelegramIcon,
  RobloxIcon,
  BrawlStarsIcon,
  PubgIcon,
  AppStoreIcon,
  GptIcon,
  PlayStationIcon,
  TikTokIcon,
  MobileLegendsIcon,
  MoreIcon,
} from '../../shared/ui/icons';

export interface ServiceItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const SERVICES: ServiceItem[] = [
  { id: 'steam', name: 'Steam', icon: <SteamIcon className="h-14 w-14 object-contain" /> },
  { id: 'telegram', name: 'Telegram', icon: <TelegramIcon className="h-14 w-14 object-contain" /> },
  { id: 'roblox', name: 'Roblox', icon: <RobloxIcon className="h-14 w-14 object-contain" /> },
  {
    id: 'brawl',
    name: 'Brawl Stars',
    icon: <BrawlStarsIcon className="h-14 w-14 object-contain" />,
  },
  { id: 'pubg', name: 'PUBG Mobile', icon: <PubgIcon className="h-14 w-14 object-contain" /> },
  {
    id: 'appstore',
    name: 'App Store',
    icon: <AppStoreIcon className="h-14 w-14 object-contain" />,
  },
  { id: 'chatgpt', name: 'ChatGPT', icon: <GptIcon className="h-14 w-14 object-contain" /> },
  {
    id: 'psn',
    name: 'PlayStation',
    icon: <PlayStationIcon className="h-14 w-14 object-contain" />,
  },
  { id: 'tiktok', name: 'TikTok', icon: <TikTokIcon className="h-14 w-14 object-contain" /> },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    icon: <MobileLegendsIcon className="h-14 w-14 object-contain" />,
  },
  { id: 'more', name: 'еще 841', icon: <MoreIcon className="h-14 w-14 object-contain" /> },
];

export interface ServiceGridProps {
  onSelectService?: (serviceId: string) => void;
}

export const ServiceGrid: React.FC<ServiceGridProps> = ({ onSelectService }) => {
  return (
    <div className="w-full overflow-x-auto py-2 scrollbar-none">
      <div className="flex items-center justify-between gap-3 min-w-max">
        {SERVICES.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectService?.(item.id)}
            className="flex flex-col items-center gap-1.5 group focus:outline-none"
          >
            <div className="h-14 w-14 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              {item.icon}
            </div>
            <span className="text-xs font-medium text-gray-700 group-hover:text-black transition-colors">
              {item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
