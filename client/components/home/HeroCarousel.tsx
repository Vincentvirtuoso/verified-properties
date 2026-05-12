"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { LuArrowRight } from "react-icons/lu";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80",
    title: "Premium Homes in Abuja",
    subtitle:
      "Experience unparalleled luxury in Nigeria's administrative heart.",
    link: "/properties/?location=Abuja",
    tag: "Exclusive Listing",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80",
    title: "Modern Living in Lagos",
    subtitle: "Curated apartments in the city that never sleeps.",
    link: "/properties/?location=Lagos&listingType=rent",
    tag: "New Arrivals",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80",
    title: "Versatile Commercial Spaces",
    subtitle: "The perfect foundation for your business growth.",
    link: "/properties/?type=Commercial",
    tag: "Business",
  },
];

export function HeroCarousel() {
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const { bannerHeight } = useBannerHeightContext();

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  // Dynamic height calculation to account for the banner
  // We use a fallback of 0px if bannerHeight isn't available yet
  const dynamicHeightStyle = {
    height: `calc(75vh - ${bannerHeight || 0}px)`,
    minHeight: `calc(500px - ${bannerHeight || 0}px)`, // Ensure it doesn't get too small
  };

  return (
    <section
      style={dynamicHeightStyle}
      className="relative w-full overflow-hidden bg-neutral-900 transition-[height] duration-300 ease-in-out"
    >
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 6000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          renderBullet: (index, className) =>
            `<span class="${className} transition-all duration-500!"></span>`,
        }}
        loop={true}
        speed={1200}
        className="w-full h-full group"
      >
        {slides.map((slide, index) => (
          <SwiperSlide
            key={index}
            className="relative w-full h-full overflow-hidden"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={slide.image}
                alt={slide.title}
                onLoad={() => handleImageLoad(index)}
                className={`w-full h-full object-cover transition-transform duration-8000 ease-out pointer-events-none ${
                  loadedImages[index] ? "scale-110" : "scale-100"
                }`}
              />
              <div className="absolute inset-0 bg-neutral-950/30" />
              <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/40 to-transparent opacity-90" />
            </div>

            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl space-y-4 sm:space-y-6">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 text-primary-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest animate-fade-in">
                    {slide.tag}
                  </span>

                  <h2 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
                    {slide.title}
                  </h2>

                  <p className="text-base sm:text-xl text-neutral-200 max-w-xl leading-relaxed opacity-90">
                    {slide.subtitle}
                  </p>

                  <div className="flex flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
                    <Link href={slide.link}>
                      <Button
                        size="lg"
                        className="bg-primary-600 hover:bg-primary-500 text-white font-bold h-12 sm:h-14 px-6 sm:px-8 rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95 group"
                      >
                        Explore Now
                        <LuArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>

                    <Link href="/contact">
                      <Button
                        variant="outline"
                        size="lg"
                        className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/20 h-12 sm:h-14 px-6 sm:px-8 rounded-xl"
                      >
                        Book a Tour
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .swiper-pagination {
          bottom: 30px !important;
          text-align: left !important;
          padding-left: 5% !important;
        }
        @media (min-width: 640px) {
          .swiper-pagination {
            bottom: 40px !important;
          }
        }
        .swiper-pagination-bullet {
          width: 20px !important;
          height: 4px !important;
          border-radius: 10px !important;
          background: rgba(255, 255, 255, 0.2) !important;
          opacity: 1 !important;
          margin: 0 4px !important;
          transition: all 0.5s ease !important;
        }
        @media (min-width: 640px) {
          .swiper-pagination-bullet {
            width: 24px !important;
            height: 5px !important;
          }
        }
        .swiper-pagination-bullet-active {
          width: 40px !important;
          background: #8b5cf6 !important;
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.5);
        }
        @media (min-width: 640px) {
          .swiper-pagination-bullet-active {
            width: 50px !important;
          }
        }

        @keyframes customFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .swiper-slide-active h2 {
          animation: customFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both 0.2s;
        }
        .swiper-slide-active p {
          animation: customFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both 0.4s;
        }
        .swiper-slide-active .flex {
          animation: customFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both 0.6s;
        }
        .swiper-slide-active span {
          animation: customFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both 0.1s;
        }
      `}</style>
    </section>
  );
}
