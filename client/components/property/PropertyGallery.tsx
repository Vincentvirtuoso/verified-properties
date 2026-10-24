"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCloseLine,
  RiZoomInLine,
  RiZoomOutLine,
} from "react-icons/ri";
import type { PropertyImage } from "@affilhomes/shared/types/property";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;
const SWIPE_PX = 60;

const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

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

  if (count === 4)
    return {
      container: "grid-cols-2 grid-rows-2",
      main: "col-span-2 row-span-1",
    };
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

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const photoParam = searchParams.get("photo");
  const lightboxIndex = photoParam !== null ? parseInt(photoParam, 10) : null;

  const [failedUrls, setFailedUrls] = useState<Set<string>>(() => new Set());
  const [mobileIndex, setMobileIndex] = useState(0);

  const triggerRef = useRef<HTMLElement | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const images = useMemo<PropertyImage[]>(() => {
  const list: PropertyImage[] = [
    ...(mainImage ? [{ url: mainImage, alt: title, section: "general" as const }] : []),
    ...gallery,
  ];

  const uniqueList = list.filter(
    (img, index, self) => index === self.findIndex((t) => t.url === img.url),
  );
  return uniqueList.length
    ? uniqueList
    : [{ url: FALLBACK, alt: title, section: "general" as const }];
}, [mainImage, gallery, title]);

  const src = (url: string) => (failedUrls.has(url) ? FALLBACK : url);

  const markFailed = useCallback((url: string) => {
    setFailedUrls((prev) => (prev.has(url) ? prev : new Set(prev).add(url)));
  }, []);

  const isOpen = lightboxIndex !== null;

  const openAt = (index: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    const params = new URLSearchParams(searchParams.toString());
    params.set("photo", index.toString());

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const close = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("photo");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    setTimeout(() => triggerRef.current?.focus(), 100);
  }, [router, pathname, searchParams]);

  const step = useCallback(
    (delta: number) => {
      if (lightboxIndex === null) return;
      const nextIndex = (lightboxIndex + delta + images.length) % images.length;
      const params = new URLSearchParams(searchParams.toString());
      params.set("photo", nextIndex.toString());

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [lightboxIndex, images.length, router, pathname, searchParams],
  );

  const handleSelect = (index: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("photo", index.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
                  "relative overflow-hidden bg-muted/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
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

      <div className="relative w-full overflow-hidden md:hidden">
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-xl hide-scrollbar"
        >
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={(e) => openAt(i, e.currentTarget)}
              aria-label={`Open photo ${i + 1} of ${images.length}`}
              className="relative h-72 w-screen shrink-0 snap-center overflow-hidden bg-muted/30"
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

      {isOpen && lightboxIndex >= 0 && lightboxIndex < images.length && (
        <Lightbox
          title={title}
          images={images}
          index={lightboxIndex}
          bannerHeight={bannerHeight}
          src={src}
          onError={markFailed}
          onClose={close}
          onStep={step}
          onSelect={handleSelect}
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
  const stageRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({
    x: 0,
    y: 0,
    originX: 0,
    originY: 0,
    moved: false,
    pinched: false,
    pinchDist: 0,
    pinchZoom: 1,
  });
  const lastTap = useRef(0);

  const reset = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return { x, y };
    const maxX = (rect.width * (z - 1)) / 2;
    const maxY = (rect.height * (z - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  useEffect(() => {
    setOffset((o) => clampOffset(o.x, o.y, zoom));
  }, [zoom, clampOffset]);

  useEffect(() => {
    reset();
  }, [index, reset]);

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

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z * 1.25));
      else if (e.key === "-") setZoom((z) => clampZoom(z / 1.25));
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reset]);

  const pointerDistance = () => {
    const [a, b] = [...pointers.current.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    stageRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const g = gesture.current;
    if (pointers.current.size === 1) {
      g.x = e.clientX;
      g.y = e.clientY;
      g.originX = offset.x;
      g.originY = offset.y;
      g.moved = false;
      g.pinched = false;
    } else if (pointers.current.size === 2) {
      g.pinched = true;
      g.pinchDist = pointerDistance();
      g.pinchZoom = zoom;
    }
    setPanning(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX;
    p.y = e.clientY;

    const g = gesture.current;

    if (pointers.current.size >= 2) {
      if (g.pinchDist > 0) {
        setZoom(clampZoom((g.pinchZoom * pointerDistance()) / g.pinchDist));
      }
      g.moved = true;
      return;
    }

    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true;

    if (zoom > 1) {
      setOffset(clampOffset(g.originX + dx, g.originY + dy, zoom));
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) return;

    setPanning(false);
    const g = gesture.current;

    if (wasSingle && !g.pinched && !g.moved) {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0;
        setZoom((z) => (z > 1 ? 1 : TAP_ZOOM));
      } else {
        lastTap.current = now;
      }
      return;
    }

    if (wasSingle && !g.pinched && zoom === 1) {
      const dx = e.clientX - g.x;
      if (Math.abs(dx) > SWIPE_PX) onStep(dx < 0 ? 1 : -1);
    }
  };

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

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z / 1.25))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-white"
          >
            <RiZoomOutLine size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => clampZoom(z * 1.25))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="rounded-md p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-2 focus-visible:outline-white"
          >
            <RiZoomInLine size={20} aria-hidden="true" />
          </button>
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
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
        {images.length > 1 && zoom === 1 && (
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

        <div
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => e.preventDefault()}
          style={{ touchAction: "none" }}
          className={cn(
            "relative h-full w-full select-none overflow-hidden",
            zoom > 1
              ? panning
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in",
          )}
        >
          <div
            className={cn(
              "absolute inset-0",
              !panning && "transition-transform duration-150 ease-out",
            )}
            style={{
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            }}
          >
            <Image
              src={src(current.url)}
              alt={current.alt || `${title} photo ${index + 1}`}
              fill
              sizes="200vw"
              className="object-contain"
              draggable={false}
              unoptimized={isUnsplash(current.url)}
              onError={() => onError(current.url)}
            />
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div
          ref={railRef}
          className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar"
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
