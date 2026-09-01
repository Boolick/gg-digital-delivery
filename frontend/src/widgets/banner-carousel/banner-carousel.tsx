import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { Button } from '../../shared/ui/button/button';

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badgeText: string;
  priceText: string;
  bgClass: string;
}

const SLIDES: BannerSlide[] = [
  {
    id: 'cs2',
    title: 'Counter-Strike 2 Prime',
    subtitle: 'Мгновенная автоматическая выдача лицензионных ключей',
    badgeText: 'ХИТ ПРОДАЖ',
    priceText: '1 499 ₽',
    bgClass: 'from-zinc-900 via-neutral-900 to-black',
  },
  {
    id: 'gta5',
    title: 'GTA V: Premium Edition',
    subtitle: 'Включает 1 000 000$ в GTA Online и Стартовый набор',
    badgeText: 'СКИДКА -40%',
    priceText: '999 ₽',
    bgClass: 'from-neutral-900 via-zinc-900 to-black',
  },
  {
    id: 'steam',
    title: 'Пополнение баланса Steam',
    subtitle: 'Пополнение счета от 500 ₽ без комиссии',
    badgeText: 'АКЦИЯ 0%',
    priceText: '500 ₽',
    bgClass: 'from-stone-900 via-zinc-900 to-black',
  },
];

export const BannerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
  };

  const activeSlide: BannerSlide = SLIDES[currentIndex] ?? (SLIDES[0] as BannerSlide);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black text-white shadow-sm"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="banner-carousel"
    >
      {/* Top Right Navigation Arrows matching Figma */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={handlePrev}
          aria-label="Предыдущий слайд"
          className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleNext}
          aria-label="Следующий слайд"
          className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Slide Content */}
      <div
        className={`p-8 sm:p-12 bg-gradient-to-r ${activeSlide.bgClass} transition-all duration-500 min-h-[220px] sm:min-h-[260px] flex flex-col justify-center relative`}
      >
        <div className="max-w-2xl space-y-3 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Zap className="h-3 w-3" />
            <span>{activeSlide.badgeText}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {activeSlide.title}
          </h2>
          <p className="text-sm sm:text-base text-gray-300">{activeSlide.subtitle}</p>
          <div className="pt-2">
            <Button variant="accent" size="md" className="rounded-xl px-6">
              Купить {activeSlide.priceText}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Right Dash Indicators matching Figma */}
      <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Слайд ${idx + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-7 bg-white' : 'w-3 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
