"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, type PanInfo } from "framer-motion";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
} from "react-icons/ri";
import type { PropertyImage } from "@affilhomes/shared/types/property";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { cn } from "@/lib/utils";

interface PropertyGalleryProps {
  mainImage?: string;
  gallery?: PropertyImage[];
  title: string;
}

const FALLBACK = "/placeholder-property.png";
const NO_IMAGES: PropertyImage[] = [];
const GRID_SLOTS = 5;

const isUnsplash = (url: string) => url.includes("images.unsplash.com");

function gridLayout(count: number) {
  if (count === 1) return { container: "grid-cols-1", main: "" };
  if (count === 2) return { container: "grid-cols-2", main: "" };
  if (count === 3)
    return { container: "grid-cols-2 grid-rows-2", main: "row-span-2" };
  return {
    container: "grid-cols-4 grid-rows-2",
    main: "col-span-2 row-span-2",
  };
}

export default function PropertyGallery({
  mainImage,
  gallery = NO_IMAGES,
  title,
}: PropertyGalleryProps) {
  const { bannerHeight } = useBannerHeightContext();

  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [mobileIndex, setMobileIndex] = useState(0);

  const triggerRef = useRef<HTMLElement | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const images = useMemo<PropertyImage[]>(() => {
    const list = [
      ...(mainImage ? [{ url: mainImage, alt: title }] : []),
      ...gallery,
    ];
    return list.length ? list : [{ url: FALLBACK, alt: title }];
  }, [mainImage, gallery, title]);

  const src = (url: string) => (failedUrls.has(url) ? FALLBACK : url);

  const markFailed = useCallback((url: string) => {
    setFailedUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  }, []);

  const isOpen = lightboxIndex !== null;

  const openAt = (index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setLightboxIndex(index);
  };

  const close = useCallback(() => {
    setLightboxIndex(null);
    triggerRef.current?.focus();
  }, []);

  const step = useCallback(
    (delta: number) => {
      setLightboxIndex((i) =>
        i === null ? null : (i + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close, step]);

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el || el.clientWidth === 0) return;
    setMobileIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const layout = gridLayout(Math.min(images.length, GRID_SLOTS));
  const visible = images.slice(0, GRID_SLOTS);
  const hiddenCount = images.length - GRID_SLOTS;

  return (
    <>
      <div className="relative hidden md:block">
        <div
          className={cn(
            "grid h-105 gap-2 overflow-hidden rounded-xl",
            layout.container,
          )}
        >
          {visible.map((img, i) => {
            const isLastSlot = i === GRID_SLOTS - 1 && hiddenCount > 0;
            return (
              <button
                key={`${img.url}-${i}`}
                type="button"
                onClick={(e) => openAt(i, e.currentTarget)}
                aria-label={`Open photo ${i + 1} of ${images.length}`}
                className={cn(
                  "relative overflow-hidden bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  i === 0 && layout.main,
                )}
              >
                <Image
                  src={src(img.url)}
                  alt={img.alt || `${title} photo ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="(max-width: 1280px) 60vw, 800px"
                  className="object-cover"
                  unoptimized={isUnsplash(img.url)}
                  onError={() => markFailed(img.url)}
                />
                {isLastSlot && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
                    +{hiddenCount} more
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => openAt(0, e.currentTarget)}
            className="absolute bottom-3 right-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
          >
            Show all {images.length} photos
          </button>
        )}
      </div>

      <div className="relative md:hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={(e) => openAt(i, e.currentTarget)}
              aria-label={`Open photo ${i + 1} of ${images.length}`}
              className="relative h-72 w-full shrink-0 snap-center overflow-hidden bg-muted"
            >
              <Image
                src={src(img.url)}
                alt={img.alt || `${title} photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
                unoptimized={isUnsplash(img.url)}
                onError={() => markFailed(img.url)}
              />
            </button>
          ))}
        </div>
        {images.length > 1 && (
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium tabular-nums text-white">
            {mobileIndex + 1} / {images.length}
          </span>
        )}
      </div>

      {isOpen && (
        <Lightbox
          title={title}
          images={images}
          index={lightboxIndex}
          bannerHeight={bannerHeight}
          src={src}
          onError={markFailed}
          onClose={close}
          onStep={step}
          onSelect={(i) => setLightboxIndex(i)}
        />
      )}
    </>
  );
}

interface LightboxProps {
  title: string;
  images: PropertyImage[];
  index: number;
  bannerHeight: number;
  src: (url: string) => string;
  onError: (url: string) => void;
  onClose: () => void;
  onStep: (delta: number) => void;
  onSelect: (index: number) => void;
}

function Lightbox({
  title,
  images,
  index,
  bannerHeight,
  src,
  onError,
  onClose,
  onStep,
  onSelect,
}: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const thumb = railRef.current?.children[index] as HTMLElement | undefined;
    thumb?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [index]);

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = dialogRef.current.querySelectorAll<HTMLElement>(
      "button:not([disabled])",
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 500) {
      onStep(info.offset.x > 0 ? -1 : 1);
    }
  };

  const current = images[index];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      onKeyDown={trapFocus}
      style={{ top: bannerHeight }}
      className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-black/95"
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-white/80">
        <span className="tabular-nums">
          {index + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
        >
          <RiCloseLine size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => onStep(-1)}
              aria-label="Previous photo"
              className="absolute left-2 z-10 hidden rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:block"
            >
              <RiArrowLeftSLine size={28} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onStep(1)}
              aria-label="Next photo"
              className="absolute right-2 z-10 hidden rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white sm:block"
            >
              <RiArrowRightSLine size={28} aria-hidden="true" />
            </button>
          </>
        )}

        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          className="relative h-full w-full cursor-grab touch-pan-y active:cursor-grabbing"
        >
          <Image
            src={src(current.url)}
            alt={current.alt || `${title} photo ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain select-none"
            draggable={false}
            unoptimized={isUnsplash(current.url)}
            onError={() => onError(current.url)}
          />
        </motion.div>
      </div>

      {images.length > 1 && (
        <div
          ref={railRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === index}
              className={cn(
                "relative h-12 w-16 shrink-0 overflow-hidden rounded transition-opacity",
                i === index
                  ? "ring-2 ring-white"
                  : "opacity-50 hover:opacity-100",
              )}
            >
              <Image
                src={src(img.url)}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={isUnsplash(img.url)}
                onError={() => onError(img.url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
