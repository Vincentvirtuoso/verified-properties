"use client";

import { LuMapPin, LuExternalLink } from "react-icons/lu";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PropertyLocation } from "@/types/property";

interface LocationPlaceholderProps {
  location: PropertyLocation;
  showMap?: boolean;
  className?: string;
  zoom?: number;
  mapWidth?: number;
  mapHeight?: number;
  useGoogleMaps?: boolean;
  googleMapsApiKey?: string;
}

export function LocationPlaceholder({
  location,
  showMap = true,
  className,
  zoom = 14,
  mapWidth = 400,
  mapHeight = 200,
  useGoogleMaps = false,
  googleMapsApiKey,
}: LocationPlaceholderProps) {
  // Format display string: "address, city, state, country"
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

  const staticMapUrl =
    useGoogleMaps && googleMapsApiKey
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&markers=color:red%7C${encodedLocation}&key=${googleMapsApiKey}`
      : `https://staticmap.openstreetmap.de/staticmap.php?center=${encodedLocation}&zoom=${zoom}&size=${mapWidth}x${mapHeight}&maptype=mapnik&markers=${encodedLocation}`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <LuMapPin className="mt-0.5 h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Location</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {displayLocation}
          </p>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
          >
            View on Maps <LuExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {showMap && (
        <div className="mt-4 overflow-hidden rounded-lg border border-border">
          <div
            className="relative"
            style={{ width: "100%", height: mapHeight }}
          >
            <Image
              src={staticMapUrl}
              alt={`Map of ${displayLocation}`}
              fill
              className="object-cover"
              unoptimized
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "flex items-center justify-center h-full bg-muted text-muted-foreground text-sm";
                  fallback.innerText = "Map preview unavailable";
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
