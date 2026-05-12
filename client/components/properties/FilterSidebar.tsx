"use client";
import { useEffect } from "react";
import { AdvancedFilters } from "./AdvancedFilters";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

export const FilterSidebar = ({
  filters,
  handleFilterChange,
  locations,
  propertyTypes,
  agents,
  priceRange,
  areaRange,
  clearAllFilters,
  allCategories,
  allFeatures,
}: any) => {
  const { bannerHeight } = useBannerHeightContext();

  useEffect(() => {
    const updateStickyTop = () => {
      const header = document.querySelector("header");
      const headerHeight = header?.getBoundingClientRect().height || 0;
      const topOffset = headerHeight + bannerHeight;
      document.documentElement.style.setProperty(
        "--sticky-filter-top",
        `${topOffset}px`,
      );
    };

    updateStickyTop();
    window.addEventListener("resize", updateStickyTop);
    window.addEventListener("scroll", updateStickyTop);
    return () => {
      window.removeEventListener("resize", updateStickyTop);
      window.removeEventListener("scroll", updateStickyTop);
    };
  }, []);

  return (
    <aside
      className="hidden lg:block w-64 shrink-0"
      aria-label="Filter sidebar"
    >
      <div
        className="sticky p-4 pr-2 bg-card rounded-2xl border border-border overflow-hidden"
        style={{
          top: `calc(var(--sticky-filter-top, 120px) + 25px)`,
          maxHeight: `calc(100dvh - var(--sticky-filter-top, 120px) - 30px)`,
        }}
      >
        <div className="flex items-center justify-between mb-5 border-b pb-3 border-border">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>
        <div
          className="px-2 overflow-y-auto"
          style={{
            height: `calc(100dvh - var(--sticky-filter-top, 120px) - 120px)`,
          }}
        >
          <AdvancedFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            locations={locations}
            propertyTypes={propertyTypes}
            agents={agents}
            priceRange={priceRange}
            areaRange={areaRange}
            onClearAll={clearAllFilters}
            allCategories={allCategories}
            allFeatures={allFeatures}
          />
        </div>
      </div>
    </aside>
  );
};
