"use client";

import { useMemo, useState } from "react";
import { LuMapPin, LuExternalLink } from "react-icons/lu";
import { cn } from "@/lib/utils";
import { PropertyLocation } from "@/types/property";

interface LocationPlaceholderProps {
  location: PropertyLocation;
  showMap?: boolean;
  className?: string;
  zoom?: number;
  mapHeight?: number;
  latitude?: number;
  longitude?: number;
}

export function LocationPlaceholder({
  location,
  showMap = true,
  className,
  zoom = 14,
  mapHeight = 200,
  latitude,
  longitude,
}: LocationPlaceholderProps) {
  const [mapFailed, setMapFailed] = useState(false);

  const displayLocation = [
    location.address,
    location.city,
    location.state,
    location.country,
  ]
    .filter(Boolean)
    .join(", ");

  const encodedLocation = encodeURIComponent(displayLocation);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const staticMapUrl = useMemo(() => {
    if (!hasCoords) return null;
    const width = 600;
    const height = 400;
    return `https://maps.wikimedia.org/img/osm-intl,${zoom},${latitude},${longitude},${width}x${height}.png`;
  }, [hasCoords, latitude, longitude, zoom]);

  const embedUrl = useMemo(() => {
    if (hasCoords) {
      const d = 0.01; 
      const bbox = [
        longitude - d,
        latitude - d,
        longitude + d,
        latitude + d,
      ].join("%2C");
      return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
    }
    return `https://maps.google.com/maps?q=${encodedLocation}&z=${zoom}&output=embed`;
  }, [hasCoords, latitude, longitude, encodedLocation, zoom]);

  const renderMap = () => {
    if (mapFailed) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Map preview unavailable
        </div>
      );
    }

    if (staticMapUrl) {
      return (
        <div className="relative h-full w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={staticMapUrl}
            alt={`Map of ${displayLocation}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setMapFailed(true)}
          />
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <LuMapPin className="h-8 w-8 text-red-600 drop-shadow-md" />
          </div>
        </div>
      );
    }

    return (
      <iframe
        title={`Map of ${displayLocation}`}
        src={embedUrl}
        className="h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        onError={() => setMapFailed(true)}
      />
    );
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <LuMapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Location</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {displayLocation}
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View on Maps <LuExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {showMap && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div className="relative w-full" style={{ height: mapHeight }}>
            {renderMap()}
          </div>
        </div>
      )}
    </div>
  );
}
