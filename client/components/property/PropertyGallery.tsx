"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiFullscreenLine,
  RiImageLine,
} from "react-icons/ri";
import { PropertyImage } from "@/types/property";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

interface PropertyGalleryProps {
  mainImage?: string;
  gallery?: PropertyImage[];
  title: string;
}

export default function PropertyGallery({
  mainImage,
  gallery = [],
  title,
}: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allImages: PropertyImage[] = [
    ...(mainImage ? [{ url: mainImage, alt: title }] : []),
    ...gallery,
  ];

  const placeholderImages: PropertyImage[] = Array.from(
    { length: 5 },
    (_, i) => ({
      url: `https://images.unsplash.com/photo-${
        [
          "1512917774080-9991f1c4c750",
          "1600596542815-ffad4c1539a9",
          "1560448204-e02f11c3d0e2",
          "1554995207-c18c203602cb",
          "1600585154340-be6161a56a0c",
        ][i]
      }?auto=format&fit=crop&w=800&q=80`,
      alt: `Property view ${i + 1}`,
    }),
  );

  const images = allImages.length > 0 ? allImages : placeholderImages;

  const openLightbox = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    // Lock body scroll
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, closeLightbox, prev, next]);

  const displayedThumbs = images.slice(1, 5);
  const remaining = images.length - 5;
  const { bannerHeight } = useBannerHeightContext();

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-120 md:h-140 rounded-2xl overflow-hidden relative">
        <motion.button
          className="col-span-4 md:col-span-2 row-span-2 relative cursor-pointer group w-full h-full text-left focus:outline-hidden focus-visible:ring-4 focus-visible:ring-violet-500"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => openLightbox(0)}
          aria-label="View full main image"
        >
          <Image
            src={images[0]?.url || "/placeholder-property.png"}
            alt={images[0]?.alt || title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
              <RiFullscreenLine size={14} aria-hidden="true" />
              View full
            </span>
          </div>
        </motion.button>

        {displayedThumbs.map((img, idx) => {
          const realIndex = idx + 1;
          const isLast = idx === 3 && remaining > 0;
          return (
            <motion.button
              key={realIndex}
              className="relative cursor-pointer group overflow-hidden hidden md:block w-full h-full focus:outline-hidden focus-visible:ring-4 focus-visible:ring-violet-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.07 }}
              onClick={() => openLightbox(realIndex)}
              aria-label={`View image ${realIndex + 1}`}
            >
              <Image
                src={img.url || "/placeholder-property.png"}
                alt={img.alt || `Image ${realIndex + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {isLast && remaining > 0 && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white transition-colors duration-300 hover:bg-black/70">
                  <RiImageLine
                    size={22}
                    className="mb-1 opacity-80"
                    aria-hidden="true"
                  />
                  <span className="text-lg font-semibold">
                    +{remaining + 1}
                  </span>
                  <span className="text-xs opacity-75 mt-0.5">more photos</span>
                </div>
              )}
            </motion.button>
          );
        })}

        {images.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="md:hidden absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full z-10 active:scale-95 transition-transform"
          >
            <RiImageLine size={14} aria-hidden="true" />
            {images.length} photos
          </button>
        )}
      </div>

      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ top: bannerHeight }}
            role="dialog"
            aria-modal="true"
          >
            <button
              onClick={closeLightbox}
              className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all z-10 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Close gallery"
            >
              <RiCloseLine size={22} aria-hidden="true" />
            </button>

            <div className="absolute top-5 left-5 text-white/60 text-sm font-medium">
              {activeIndex + 1} / {images.length}
            </div>

            <motion.div
              key={activeIndex}
              className="relative w-full max-w-5xl h-[70vh] mx-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <Image
                src={images[activeIndex]?.url || "/placeholder-property.png"}
                alt={images[activeIndex]?.alt || `Image ${activeIndex + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </motion.div>

            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Previous image"
            >
              <RiArrowLeftLine size={20} aria-hidden="true" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              aria-label="Next image"
            >
              <RiArrowRightLine size={20} aria-hidden="true" />
            </button>

            <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2 px-6 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === activeIndex ? "true" : "false"}
                  className={`relative w-14 h-10 rounded-md overflow-hidden shrink-0 transition-all duration-200 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-white ${
                    i === activeIndex
                      ? "ring-2 ring-violet-400 opacity-100 scale-110"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.url || "/placeholder-property.png"}
                    alt={img.alt || `Thumb ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
