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
        className="sticky overflow-y-auto p-4 bg-card rounded-l-2xl border border-border"
        style={{
          top: `var(--sticky-filter-top, 120px)`,
          maxHeight: `calc(100dvh - var(--sticky-filter-top, 120px) - 32px)`,
        }}
      >
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
            aria-label="Clear all filters"
          >
            Clear All
          </button>
        </div>

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
    </aside>
  );
};
