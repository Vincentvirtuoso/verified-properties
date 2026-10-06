"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { imageLoader } from "@/utils/helpers";

const DEFAULT_FALLBACK = "/placeholder_avatar.png";

export interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  alt?: string;
  fallbackSrc?: string | null;
  priority?: boolean;
  shape?: "circle" | "square";
  initials?: string;
  maxInitials?: 1 | 2;
  quality?: number;
  fallbackIcon?: React.ReactNode;
}

function getInitials(name: string, maxInitials: 1 | 2 = 2): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (maxInitials === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  src,
  name,
  size = 40,
  className,
  alt,
  shape,
  initials,
  maxInitials = 2,
  fallbackSrc = DEFAULT_FALLBACK,
  priority = false,
  quality = 90,
  fallbackIcon,
}: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(src));

  const effectiveImageFallback = fallbackIcon ? null : fallbackSrc;
  const resolvedSrc =
    src && failedSrc !== src
      ? src
      : effectiveImageFallback && failedSrc !== effectiveImageFallback
        ? effectiveImageFallback
        : null;

  const box = {
    width: size,
    height: size,
  } as const;

  const label = alt ?? name;

  const radius = shape === "circle" ? "rounded-full" : "rounded-xl";

  const displayInitials = initials ?? getInitials(name, maxInitials);

  useEffect(() => {
    setIsLoading(Boolean(resolvedSrc));
  }, [resolvedSrc]);

  if (!resolvedSrc) {
    if (fallbackIcon) {
      return (
        <span
          role="img"
          aria-label={label}
          style={box}
          className={cn(
            "inline-flex shrink-0 select-none items-center justify-center",
            radius,
            "bg-subtle text-muted-foreground",
            className,
          )}
        >
          {fallbackIcon}
        </span>
      );
    }
    return (
      <span
        role="img"
        aria-label={label}
        style={box}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center",
          radius,
          "bg-linear-to-br from-primary/80 to-primary",
          "font-semibold text-primary-foreground",
          className,
        )}
      >
        <span style={{ fontSize: Math.round(size * 0.4) }}>
          {displayInitials}
        </span>
      </span>
    );
  }

  return (
    <span
      style={box}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden",
        "bg-subtle",
        radius,
        className,
      )}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 z-10",
            "bg-subtle",
            "before:absolute before:inset-0",
            "before:-translate-x-full",
            "before:animate-[shimmer_1.5s_infinite]",
            "before:bg-linear-to-r",
            "before:from-transparent before:via-foreground/10 before:to-transparent",
          )}
        />
      )}

      <Image
        src={resolvedSrc}
        alt={label}
        fill
        quality={quality}
        sizes={`${size}px`}
        loader={imageLoader}
        priority={priority}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setFailedSrc(resolvedSrc);
        }}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-200",
          isLoading ? "opacity-0" : "opacity-100",
        )}
      />
    </span>
  );
}
