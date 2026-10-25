import { useState } from "react";
import { AdminListing } from "../supabase/admin";
import { LuImage } from "react-icons/lu";

export function ListingThumb({
  image,
  title,
  count,
}: {
  image: AdminListing["coverImage"];
  title: string;
  count: number;
}) {
  const [failed, setFailed] = useState(false);

  const hasImage = !!image && !failed;
  const showStack = hasImage && count > 1;
  const showThirdLayer = hasImage && count > 2;

  return (
    <div className="relative w-30 shrink-0 pb-2 pr-2">
      {showThirdLayer && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 aspect-4/3 w-28 translate-x-2 translate-y-2 rounded-xl bg-secondary ring-1 ring-muted/20"
        />
      )}

      {showStack && (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 aspect-4/3 w-28 translate-x-1 translate-y-1 rounded-xl bg-card ring-1 ring-muted/30"
        />
      )}

      <div className="relative aspect-4/3 w-28 overflow-hidden rounded-xl bg-secondary ring-1 ring-border/50">
        {hasImage ? (
          <img
            src={image!.url}
            alt={image!.alt || `Photo of ${title}`}
            loading="lazy"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center text-muted-foreground"
          >
            <LuImage size={20} />
          </div>
        )}

        {showStack && (
          <span className="absolute bottom-1.5 right-1.5 rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-medium tabular-nums backdrop-blur">
            +{count - 1}
          </span>
        )}
      </div>
    </div>
  );
}
