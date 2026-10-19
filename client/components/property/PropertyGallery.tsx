"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  RiCloseLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiFullscreenLine,
  RiImageLine,
  RiDragMoveLine,
} from "react-icons/ri";
import { PropertyImage } from "@affilhomes/shared/types/property";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  mainImage?: string;
  gallery?: PropertyImage[];
  title: string;
}

const FALLBACK = "/placeholder-property.png";

function isUnsplash(url?: string) {
  return !!url?.includes("images.unsplash.com");
}

/* -------------------------------------------------------------------------- */
/*  Responsive hook — true when viewport is below the md breakpoint           */
/* -------------------------------------------------------------------------- */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}

/* -------------------------------------------------------------------------- */
/*  Desktop grid layout — adapts to how many images actually exist            */
/* -------------------------------------------------------------------------- */
function getGridClasses(count: number) {
  switch (count) {
    case 1:
      return { container: "grid-cols-1", main: "col-span-1", thumb: "hidden" };
    case 2:
      return {
        container: "grid-cols-2",
        main: "col-span-1",
        thumb: "col-span-1",
      };
    case 3:
      return {
        container: "grid-cols-3",
        main: "col-span-2",
        thumb: "col-span-1",
      };
    case 4:
      return {
        container: "grid-cols-2",
        main: "col-span-1",
        thumb: "col-span-1",
      };
    default:
      return {
        container: "grid-cols-4 grid-rows-2",
        main: "col-span-2 row-span-2",
        thumb: "col-span-1 row-span-1",
      };
  }
}

export default function PropertyGallery({
  mainImage,
  gallery = [],
  title,
}: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const isMobile = useIsMobile();

  const allImages: PropertyImage[] = useMemo(
    () => [
      ...(mainImage ? [{ url: mainImage, alt: title }] : []),
      ...gallery,
    ],
    [mainImage, gallery, title],
  );

  /* Prefer real images; only fall back to Unsplash demo shots if empty */
  const placeholderImages: PropertyImage[] = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        url: `https://images.unsplash.com/photo-${
          [
            "1512917774080-9991f1c4c750",
            "1600596542815-ffad4c1539a9",
            "1560448204-e02f11c3d0e2",
            "1554995207-c18c203602cb",
            "1600585154340-be6161a56a0c",
          ][i]
        }?auto=format&fit=crop&w=1600&q=80`,
        alt: `Property view ${i + 1}`,
      })),
    [],
  );

  const images = allImages.length > 0 ? allImages : placeholderImages;

  /* Reset failed URLs when the image set changes */
  useEffect(() => {
    setFailedUrls(new Set());
  }, [mainImage, gallery]);

  const getSrc = (url?: string) =>
    !url || failedUrls.has(url) ? FALLBACK : url;

  const handleError = (url?: string) => {
    if (url) setFailedUrls((prev) => new Set(prev).add(url));
  };

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

  /* ---------------- Keyboard + scroll lock while lightbox is open -------- */
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [lightboxOpen, closeLightbox, prev, next]);

  const { bannerHeight } = useBannerHeightContext();

  /* ---------------- Mobile carousel scroll tracking ---------------------- */
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setMobileIndex(index);
  }, []);

  /* ---------------- Lightbox drag gestures ------------------------------- */
  const dragY = useMotionValue(0);
  const lightboxOpacity = useTransform(dragY, [0, 280], [1, 0]);
  const lightboxScale = useTransform(dragY, [0, 280], [1, 0.92]);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
  ) => {
    const { x, y } = info.offset;
    const swipeThreshold = 70;

    /* Vertical drag is the dismiss gesture */
    if (y > 120 || info.velocity.y > 600) {
      closeLightbox();
      return;
    }

    /* Horizontal drag navigates */
    if (Math.abs(x) > swipeThreshold) {
      if (x > 0) prev();
      else next();
    }

    /* Spring back */
    dragY.set(0);
  };

  /* ---------------- Layout decision ------------------------------------- */
  const visibleCount = Math.min(images.length, 5);
  const grid = getGridClasses(visibleCount);
  const thumbnails = images.slice(1, 5);
  const remaining = images.length - 5;

  /* ---------------- Desktop grid --------------------------------------- */
  if (!isMobile) {
    return (
      <>
        <div
          className={cn(
            "grid gap-2 h-[420px] rounded-2xl overflow-hidden relative",
            grid.container,
          )}
        >
          {/* Main image */}
          <motion.button
            className={cn(
              "relative cursor-pointer group w-full h-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500",
              grid.main,
            )}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            onClick={() => openLightbox(0)}
            aria-label={`View ${title} — photo 1 of ${images.length}`}
          >
            <Image
              src={getSrc(images[0]?.url)}
              alt={images[0]?.alt || title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
              sizes="(max-width: 1200px) 66vw, 50vw"
              unoptimized={isUnsplash(images[0]?.url)}
              onError={() => handleError(images[0]?.url)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
                <RiFullscreenLine size={14} aria-hidden="true" />
                View full
              </span>
            </div>
          </motion.button>

          {/* Thumbnails / supporting images */}
          {thumbnails.map((img, idx) => {
            const realIndex = idx + 1;
            const isLast = idx === 3 && remaining > 0;
            return (
              <motion.button
                key={realIndex}
                className={cn(
                  "relative cursor-pointer group overflow-hidden w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-500",
                  grid.thumb,
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + idx * 0.07 }}
                onClick={() => openLightbox(realIndex)}
                aria-label={`View ${title} — photo ${realIndex + 1} of ${images.length}`}
              >
                <Image
                  src={getSrc(img.url)}
                  alt={img.alt || `Image ${realIndex + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 1200px) 33vw, 25vw"
                  unoptimized={isUnsplash(img.url)}
                  onError={() => handleError(img.url)}
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {isLast && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white transition-colors duration-300 hover:bg-black/70">
                    <RiImageLine size={22} className="mb-1 opacity-80" aria-hidden="true" />
                    <span className="text-lg font-semibold">+{remaining + 1}</span>
                    <span className="text-xs opacity-75 mt-0.5">more photos</span>
                  </div>
                )}
              </motion.button>
            );
          })}

          {/* "Show all photos" — always visible, not hover-dependent */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={() => openLightbox(0)}
              className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm text-foreground text-sm font-medium px-4 py-2 rounded-full shadow-lg hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <RiImageLine size={15} aria-hidden="true" />
              Show all {images.length} photos
            </button>
          )}
        </div>

        <Lightbox
          open={lightboxOpen}
          onClose={closeLightbox}
          images={images}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          prev={prev}
          next={next}
          dragY={dragY}
          opacity={lightboxOpacity}
          scale={lightboxScale}
          handleDragEnd={handleDragEnd}
          getSrc={getSrc}
          handleError={handleError}
          bannerHeight={bannerHeight}
        />
      </>
    );
  }

  /* ---------------- Mobile carousel ------------------------------------ */
  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        {/* Scroll-snap carousel — native swipe, no JS drag needed */}
        <div
          ref={carouselRef}
          onScroll={handleCarouselScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              className="relative shrink-0 w-full snap-center h-[280px] focus:outline-none"
              onClick={() => openLightbox(i)}
              aria-label={`View ${title} — photo ${i + 1} of ${images.length}`}
            >
              <Image
                src={getSrc(img.url)}
                alt={img.alt || `${title} — photo ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="100vw"
                unoptimized={isUnsplash(img.url)}
                onError={() => handleError(img.url)}
              />
            </button>
          ))}
        </div>

        {/* Counter pill */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-3 py-1.5 rounded-full pointer-events-none">
          {mobileIndex + 1} / {images.length}
        </div>

        {/* Swipe hint — fades after first interaction */}
        {images.length > 1 && mobileIndex === 0 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 pointer-events-none animate-pulse">
            <RiDragMoveLine size={12} aria-hidden="true" />
            Swipe to browse
          </div>
        )}

        {/* Show all photos */}
        <button
          type="button"
          onClick={() => openLightbox(mobileIndex)}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-foreground text-sm font-medium px-3.5 py-2 rounded-full shadow-lg active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        >
          <RiImageLine size={15} aria-hidden="true" />
          {images.length} photos
        </button>
      </div>

      <Lightbox
        open={lightboxOpen}
        onClose={closeLightbox}
        images={images}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        prev={prev}
        next={next}
        dragY={dragY}
        opacity={lightboxOpacity}
        scale={lightboxScale}
        handleDragEnd={handleDragEnd}
        getSrc={getSrc}
        handleError={handleError}
        bannerHeight={bannerHeight}
      />
    </>
  );
}