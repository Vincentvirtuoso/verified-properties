import { Ad } from "@/data/ads";
import Image from "next/image";
import { useState, useEffect } from "react";
import { LuX } from "react-icons/lu";

interface BannerProps {
  ads: Ad[];
  autoRotateInterval?: number;
}

export const Banner = ({ ads, autoRotateInterval = 5000 }: BannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (ads.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, autoRotateInterval);
    return () => clearInterval(interval);
  }, [ads.length, autoRotateInterval]);

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className="relative overflow-hidden w-full bg-linear-to-br from-primary-600 to-primary-800 shadow-lg z-50 text-white">
      <div
        key={currentIndex}
        className="shimmer-effect animate-shimmer pointer-events-none"
      />

      <div className="container mx-auto px-4 py-3 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4 flex-1">
          {currentAd.imageUrl && (
            <Image
              src={currentAd.imageUrl}
              alt={currentAd.title}
              className="h-10 w-10 object-cover rounded shadow-sm"
              width={500}
              height={500}
            />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm md:text-base leading-tight">
              {currentAd.title}
            </p>
            <p className="text-xs opacity-80 hidden md:block">
              {currentAd.description}
            </p>
          </div>
          <a
            href={currentAd.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-primary-700 px-3 py-1.5 rounded-md text-sm font-bold hover:bg-neutral-100 transition-colors shadow-sm"
          >
            {currentAd.cta}
          </a>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-white/80 hover:text-white transition-colors p-1"
          aria-label="Close banner"
        >
          <LuX size={20} />
        </button>
      </div>
    </div>
  );
};
