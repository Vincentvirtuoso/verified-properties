import { LuX } from "react-icons/lu";
import { AdvancedFilters } from "./AdvancedFilters";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { useProperty } from "@/hooks/useProperty";
import {
  PropertyCategory,
  PropertyDocument,
  PropertyFeature,
  PropertyFilterState,
  PropertyLocation,
  PropertyType,
} from "@/types";

export function MobileFilterDrawer({
  filters,
  onFilterChange,
  locations,
  propertyTypes,
  priceRange,
  areaRange,
  onClose,
}: {
  filters: PropertyFilterState;
  onFilterChange: (filters: Partial<PropertyFilterState>) => void;
  locations: PropertyLocation[];
  propertyTypes: PropertyType[];
  allCategories: PropertyCategory[];
  allFeatures: PropertyFeature[];
  allDocuments: PropertyDocument[];
  onClose: () => void;
  priceRange: [number, number];
  areaRange: [number, number];
}) {
  const { bannerHeight } = useBannerHeightContext();
  const { ALL_CATEGORIES, ALL_FEATURES, ALL_DOCUMENTS } = useProperty();

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="absolute right-0 h-full w-full max-w-md bg-background shadow-xl pr-1"
        style={{ top: bannerHeight }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Apply filters
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        <div
          className="p-4 overflow-y-auto transition-all duration-300"
          style={{ height: `calc(100vh - ${bannerHeight + 64}px)` }}
        >
          <AdvancedFilters
            filters={filters}
            onFilterChange={onFilterChange}
            locations={locations}
            propertyTypes={propertyTypes}
            priceRange={priceRange}
            areaRange={areaRange}
            allCategories={ALL_CATEGORIES}
            allFeatures={ALL_FEATURES}
            allDocuments={ALL_DOCUMENTS || []}
          />
        </div>
      </div>
    </div>
  );
}
