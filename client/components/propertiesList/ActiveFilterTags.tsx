"use client";

import { LuX } from "react-icons/lu";
import type { PropertyFilterState } from "@/types";
import { PROPERTY_CATEGORY_LABELS } from "@/utils/constants";
import { FilterTag } from "./FilterTag";

interface ActiveFilterTagsProps {
  filters: PropertyFilterState;
  defaultFilters: PropertyFilterState;
  searchQuery: string;
  onRemove: (key: keyof PropertyFilterState | "search") => void;
  onClearAll: () => void;
}

export function ActiveFilterTags({
  filters,
  defaultFilters,
  searchQuery,
  onRemove,
  onClearAll,
}: ActiveFilterTagsProps) {
  const priceChanged =
    filters.priceRange[0] > defaultFilters.priceRange[0] ||
    filters.priceRange[1] < defaultFilters.priceRange[1];

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground/80">
          Active Filters:
        </span>
        <button
          onClick={onClearAll}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {searchQuery && (
          <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset max-w-sm transition-colors bg-info/10 text-info ring-info/20 dark:bg-info/20 dark:text-info-foreground">
            <span className="line-clamp-1">Search: {searchQuery}</span>
            <button
              onClick={() => onRemove("search")}
              className="hover:bg-primary/20 rounded-full p-0.5"
              aria-label="Remove search filter"
            >
              <LuX className="w-3 h-3" />
            </button>
          </div>
        )}

        {filters.category !== "all" && (
          <FilterTag
            label={`Category: ${PROPERTY_CATEGORY_LABELS[filters.category]}`}
            onRemove={() => onRemove("category")}
          />
        )}

        {filters.type.length > 0 && (
          <FilterTag
            label={`Type: ${filters.type.length} selected`}
            onRemove={() => onRemove("type")}
          />
        )}

        {filters.documents.length > 0 && (
          <FilterTag
            label={`Documents: ${filters.documents.length} types`}
            onRemove={() => onRemove("documents")}
          />
        )}

        {filters.features.length > 0 && (
          <FilterTag
            label={`Features: ${filters.features.length} selected`}
            onRemove={() => onRemove("features")}
          />
        )}

        {filters.location !== "all" && (
          <FilterTag
            label={`Location: ${filters.location}`}
            onRemove={() => onRemove("location")}
          />
        )}

        {filters.bedrooms !== "any" && (
          <FilterTag
            label={`${filters.bedrooms} ${
              filters.bedrooms === "1" ? "Bed" : "Beds"
            }`}
            onRemove={() => onRemove("bedrooms")}
          />
        )}

        {filters.bathrooms !== "any" && (
          <FilterTag
            label={`${filters.bathrooms} ${
              filters.bathrooms === "1" ? "Bath" : "Baths"
            }`}
            onRemove={() => onRemove("bathrooms")}
          />
        )}

        {priceChanged && (
          <FilterTag
            label={`Price: ₦${(filters.priceRange[0] / 1_000_000).toFixed(
              1,
            )}M - ₦${(filters.priceRange[1] / 1_000_000).toFixed(1)}M`}
            onRemove={() => onRemove("priceRange")}
          />
        )}
      </div>
    </div>
  );
}
