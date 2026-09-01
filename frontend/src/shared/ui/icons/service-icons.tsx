import React from 'react';
import steamSvg from '../../assets/icons/Steam.svg';
import telegramSvg from '../../assets/icons/Telegram.svg';
import robloxSvg from '../../assets/icons/Roblox.svg';
import brawlStarsSvg from '../../assets/icons/Brawl Stars.svg';
import pubgSvg from '../../assets/icons/PUBG Mob.svg';
import appStoreSvg from '../../assets/icons/App Store.svg';
import gptSvg from '../../assets/icons/gpt.svg';
import playStationSvg from '../../assets/icons/PlayStation.svg';
import tikTokSvg from '../../assets/icons/TikTok.svg';
import mobileLegendsSvg from '../../assets/icons/Mobile Legends.svg';
import moreSvg from '../../assets/icons/more.svg';

export interface ServiceIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const SteamIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={steamSvg} alt="Steam" className={className} {...props} />
);

export const TelegramIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={telegramSvg} alt="Telegram" className={className} {...props} />
);

export const RobloxIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={robloxSvg} alt="Roblox" className={className} {...props} />
);

export const BrawlStarsIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={brawlStarsSvg} alt="Brawl Stars" className={className} {...props} />
);

export const PubgIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={pubgSvg} alt="PUBG Mobile" className={className} {...props} />
);

export const AppStoreIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={appStoreSvg} alt="App Store" className={className} {...props} />
);

export const GptIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={gptSvg} alt="ChatGPT" className={className} {...props} />
);

export const PlayStationIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={playStationSvg} alt="PlayStation" className={className} {...props} />
);

export const TikTokIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={tikTokSvg} alt="TikTok" className={className} {...props} />
);

export const MobileLegendsIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={mobileLegendsSvg} alt="Mobile Legends" className={className} {...props} />
);

export const MoreIcon: React.FC<ServiceIconProps> = ({ className, ...props }) => (
  <img src={moreSvg} alt="Еще" className={className} {...props} />
);
