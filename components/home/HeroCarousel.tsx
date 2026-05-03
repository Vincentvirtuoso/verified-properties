"use client";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=600&fit=crop",
    title: "Premium Homes in Abuja",
    subtitle: "Discover luxury living in the capital city",
    link: "/properties?location=Abuja",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=600&fit=crop",
    title: "Affordable Rentals in Lagos",
    subtitle: "Find your perfect apartment today",
    link: "/properties?location=Lagos&listingType=rent",
  },
  {
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&h=600&fit=crop",
    title: "Commercial Spaces",
    subtitle: "Offices, shops, and event centres available",
    link: "/properties?type=Commercial",
  },
];

export function HeroCarousel() {
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true, dynamicBullets: true }}
        loop={true}
        className="h-100 sm:h-125 lg:h-150 w-full"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index} className="relative">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 flex items-end p-8 sm:p-12 lg:p-20">
              <div className="max-w-7xl mx-auto w-full">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fadeInUp">
                  {slide.title}
                </h2>
                <p className="text-lg sm:text-xl text-gray-200 mb-8 max-w-2xl">
                  {slide.subtitle}
                </p>
                <Link href={slide.link}>
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Explore Now
                  </Button>
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
