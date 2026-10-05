"use client";

import { useEffect } from "react";
import { FiSliders } from "react-icons/fi";

import { AdvancedFilters } from "./AdvancedFilters";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

import {
  PropertyCategory,
  PropertyDocument,
  PropertyFeature,
  PropertyFilterState,
  PropertyLocation,
  PropertyType,
} from "@/types";

export const FilterSidebar = ({
  filters,
  handleFilterChange,
  locations,
  propertyTypes,
  priceRange,
  areaRange,
  clearAllFilters,
  allCategories,
  allFeatures,
  allDocuments,
}: {
  filters: PropertyFilterState;
  handleFilterChange: (
    newFilters: Partial<PropertyFilterState>,
  ) => void;
  locations: PropertyLocation[];
  propertyTypes: PropertyType[];
  priceRange: [number, number];
  areaRange: [number, number];
  clearAllFilters: () => void;
  allCategories: PropertyCategory[];
  allFeatures: PropertyFeature[];
  allDocuments: PropertyDocument[];
}) => {
  const { bannerHeight } = useBannerHeightContext();

  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.querySelector("header");
      const headerHeight =
        header?.getBoundingClientRect().height || 0;

      const topOffset = headerHeight + bannerHeight;

      document.documentElement.style.setProperty(
        "--sticky-filter-top",
        `${topOffset}px`,
      );
    };

    updateStickyTop();

    window.addEventListener("resize", updateStickyTop);

    return () => {
      window.removeEventListener("resize", updateStickyTop);
    };
  }, [bannerHeight]);

  return (
    <aside
      className="hidden w-72 shrink-0 lg:block"
      aria-label="Property filters"
    >
      <div
        className="sticky overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        style={{
          top: "calc(var(--sticky-filter-top, 120px) + 20px)",
          maxHeight:
            "calc(100dvh - var(--sticky-filter-top, 120px) - 40px)",
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FiSliders size={15} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Filters
              </h2>

              <p className="text-xs text-muted-foreground">
                Refine your search
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearAllFilters}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            aria-label="Clear all property filters"
          >
            Clear all
          </button>
        </div>

        <div
          className="overflow-y-auto px-5 py-4 scrollbar-thin"
          style={{
            maxHeight:
              "calc(100dvh - var(--sticky-filter-top, 120px) - 110px)",
            minHeight:
              "calc(100dvh - var(--sticky-filter-top, 120px) - 110px)",
          }}
        >
          <AdvancedFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            locations={locations}
            propertyTypes={propertyTypes}
            priceRange={priceRange}
            areaRange={areaRange}
            allCategories={allCategories}
            allFeatures={allFeatures}
            allDocuments={allDocuments}
          />
        </div>
      </div>
    </aside>
  );
};