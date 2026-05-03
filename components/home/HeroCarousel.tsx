"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop",
    title: "Premium Homes in Abuja",
    subtitle: "Discover luxury living in the capital city",
    link: "/properties/?location=Abuja",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop",
    title: "Affordable Rentals in Lagos",
    subtitle: "Find your perfect apartment today",
    link: "/properties/?location=Lagos&listingType=rent",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop",
    title: "Commercial Spaces",
    subtitle: "Offices, shops, and event centres available",
    link: "/properties/?type=Commercial",
  },
];

export function HeroCarousel() {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section className="relative w-full h-100 sm:h-125 lg:h-150 overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
          renderBullet: (index, className) =>
            `<span class="${className} w-3! h-3! bg-white/50! opacity-100!"></span>`,
        }}
        loop={true}
        speed={1000}
        className="w-full h-full"
        style={{ height: "100%" }}
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative w-full h-full">
            {/* Image container */}
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                priority={index === 0}
                className={`object-cover transition-transform duration-2000 ${
                  loadedImages[index] ? "scale-100" : "scale-110"
                }`}
                onLoadingComplete={() => handleImageLoad(index)}
              />
              {/* Loading shimmer */}
              {!loadedImages[index] && (
                <div className="absolute inset-0 bg-gray-800 animate-pulse" />
              )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/30 to-transparent" />

            {/* Content */}
            <div className="relative z-10 flex h-full items-end pb-12 sm:pb-16 lg:pb-24">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight animate-fadeInUp">
                  {slide.title}
                </h2>
                <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl">
                  {slide.subtitle}
                </p>
                <Link href={slide.link}>
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Explore Now
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom CSS for Swiper pagination styling (optional) */}
      <style jsx global>{`
        .swiper-pagination-bullet-active {
          background: #f97316 !important; /* orange-500 */
          opacity: 1 !important;
        }
      `}</style>
    </section>
  );
}
