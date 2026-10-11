"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { PropertyCard } from "@/components/property/PropertyCard";
import { FilterSidebar } from "@/components/propertiesList/FilterSidebar";
import { MobileFilterDrawer } from "@/components/propertiesList/MobileFilterDropdown";
import { NoResults } from "@/components/propertiesList/NoResults";
import { FilterType, SortOption, useProperty } from "@/hooks/useProperty";
import { usePropertiesData } from "@/hooks/usePropertiesData";
import { usePropertySearch } from "@/hooks/usePropertySearch";
import type { PropertyFilterState } from "@/types";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
} from "@/utils/constants";

import { PropertiesHeader } from "./PropertiesHeader";
import { PropertySearch } from "./PropertySearch";
import { PropertiesResultsHeader } from "./PropertiesResultsHeader";
import { ActiveFilterTags } from "./ActiveFilterTags";
import { PropertiesResults } from "./PropertiesResults";

export function PropertiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { properties, isLoading, error: loadError } = usePropertiesData();
  const search = usePropertySearch(properties);

  const {
    SORT_OPTIONS,
    LOCATIONS,
    ALL_PROPERTY_TYPES,
    ALL_CATEGORIES,
    ALL_FEATURES,
    PRICE_MIN,
    PRICE_MAX,
    AREA_MIN,
    AREA_MAX,
    DEFAULT_FILTERS,
    ALL_DOCUMENTS,
  } = useProperty(properties);

  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    setFilters(DEFAULT_FILTERS);
  }, [DEFAULT_FILTERS]);

  const currentType = (searchParams.get("type") as FilterType) || "all";

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (
      filters.priceRange[0] > DEFAULT_FILTERS.priceRange[0] ||
      filters.priceRange[1] < DEFAULT_FILTERS.priceRange[1]
    )
      count++;
    if (filters.bedrooms !== "any") count++;
    if (filters.bathrooms !== "any") count++;
    if (filters.category !== "all") count++;
    if (filters.type.length > 0) count++;
    if (filters.documents.length > 0) count++;
    if (filters.features.length > 0) count++;
    if (filters.location !== "all") count++;
    if (
      filters.minArea > DEFAULT_FILTERS.minArea ||
      filters.maxArea < DEFAULT_FILTERS.maxArea
    )
      count++;
    if (search.searchQuery) count++;
    return count;
  }, [filters, search.searchQuery, DEFAULT_FILTERS]);

  const { sortedProperties } = useMemo(() => {
    const filtered = properties.filter((property) => {
      if (search.debouncedSearchQuery) {
        const q = search.debouncedSearchQuery.toLowerCase();
        const searchable = [
          property.title,
          property.description,
          property.location.city,
          property.location.state,
          property.location.address,
          PROPERTY_TYPE_LABELS[property.type],
          PROPERTY_CATEGORY_LABELS[property.category],
          ...(property.features ?? []).map((f) => PROPERTY_FEATURE_LABELS[f]),
        ].filter(Boolean);
        if (!searchable.some((s) => s?.toLowerCase().includes(q))) return false;
      }

      if (currentType === "deals") {
        if (
          !property.discount ||
          (property.discount.amount == null &&
            property.discount.percentage == null)
        )
          return false;
      } else if (
        currentType !== "all" &&
        property.listingPurpose !== currentType
      ) {
        return false;
      }

      if (
        property.price < filters.priceRange[0] ||
        property.price > filters.priceRange[1]
      )
        return false;

      if (filters.bedrooms !== "any") {
        const num = parseInt(filters.bedrooms);
        if (filters.bedrooms === "5+") {
          if (property.bedrooms < 5) return false;
        } else if (property.bedrooms !== num) return false;
      }

      if (filters.bathrooms !== "any") {
        const num = parseInt(filters.bathrooms);
        if (filters.bathrooms === "5+") {
          if (property.bathrooms < 5) return false;
        } else if (property.bathrooms !== num) return false;
      }

      if (filters.category !== "all" && property.category !== filters.category)
        return false;

      if (filters.type.length > 0 && !filters.type.includes(property.type))
        return false;

      if (
        filters.documents.length > 0 &&
        !property.documents?.some((doc) => filters.documents.includes(doc.type))
      )
        return false;

      if (filters.features.length > 0) {
        const propertyFeats = property.features ?? [];
        if (!filters.features.every((f) => propertyFeats.includes(f)))
          return false;
      }

      if (filters.location !== "all") {
        const locStr = filters.location.toLowerCase();
        const locationMatch =
          property.location.city.toLowerCase().includes(locStr) ||
          property.location.state.toLowerCase().includes(locStr) ||
          property.location.address.toLowerCase().includes(locStr);
        if (!locationMatch) return false;
      }

      if (property.area) {
        if (property.area < filters.minArea || property.area > filters.maxArea)
          return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
        default: {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        }
      }
    });

    return { sortedProperties: sorted };
  }, [properties, currentType, sortBy, filters, search.debouncedSearchQuery]);

  const handleTypeChange = useCallback(
    (type: FilterType) => {
      const params = new URLSearchParams(searchParams.toString());
      startTransition(() => {
        if (type === "all") params.delete("type");
        else params.set("type", type);
        router.push(`/properties?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  const handleFilterChange = useCallback(
    (newFilters: Partial<PropertyFilterState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    search.clearSearch();
  }, [DEFAULT_FILTERS, search]);

  const removeFilter = useCallback(
    (filterKey: keyof PropertyFilterState | "search") => {
      if (filterKey === "search") {
        search.clearSearch();
      } else {
        setFilters((prev) => ({
          ...prev,
          [filterKey]: DEFAULT_FILTERS[filterKey],
        }));
      }
    },
    [DEFAULT_FILTERS, search],
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 sm:py-10">
        <PropertiesHeader
          currentType={currentType}
          onTypeChange={handleTypeChange}
          isPending={isPending}
        />

        <PropertySearch search={search} />

        <div className="flex flex-col lg:flex-row gap-6">
          <FilterSidebar
            filters={filters}
            handleFilterChange={handleFilterChange}
            locations={LOCATIONS}
            propertyTypes={ALL_PROPERTY_TYPES}
            priceRange={[PRICE_MIN, PRICE_MAX]}
            areaRange={[AREA_MIN, AREA_MAX]}
            clearAllFilters={clearAllFilters}
            allCategories={ALL_CATEGORIES}
            allFeatures={ALL_FEATURES}
            allDocuments={ALL_DOCUMENTS}
          />

          <div className="flex-1">
            <PropertiesResultsHeader
              resultCount={sortedProperties.length}
              debouncedSearchQuery={search.debouncedSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={SORT_OPTIONS}
              activeFiltersCount={activeFiltersCount}
              onOpenMobileFilters={() => setShowMobileFilters(true)}
            >
              {activeFiltersCount > 0 && (
                <ActiveFilterTags
                  filters={filters}
                  defaultFilters={DEFAULT_FILTERS}
                  searchQuery={search.searchQuery}
                  onRemove={removeFilter}
                  onClearAll={clearAllFilters}
                />
              )}
            </PropertiesResultsHeader>

            <PropertiesResults
              isPending={isPending}
              isLoading={isLoading}
              error={loadError}
              onRetry={() => window.location.reload()}
            >
              <motion.div
                id="property-list"
                layout
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {sortedProperties.map((property, index) => (
                  <motion.div
                    key={property.slug}
                    layout
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.04, 0.2),
                    }}
                  >
                    <PropertyCard {...property} />
                  </motion.div>
                ))}
              </motion.div>

              {sortedProperties.length === 0 && (
                <NoResults
                  search={search.searchQuery}
                  onClear={clearAllFilters}
                />
              )}
            </PropertiesResults>
          </div>
        </div>
      </div>

      {showMobileFilters && (
        <MobileFilterDrawer
          filters={filters}
          onFilterChange={handleFilterChange}
          locations={LOCATIONS}
          propertyTypes={ALL_PROPERTY_TYPES}
          priceRange={[PRICE_MIN, PRICE_MAX]}
          areaRange={[AREA_MIN, AREA_MAX]}
          allCategories={ALL_CATEGORIES}
          allDocuments={ALL_DOCUMENTS}
          allFeatures={ALL_FEATURES}
          onClose={() => setShowMobileFilters(false)}
        />
      )}
    </div>
  );
}
