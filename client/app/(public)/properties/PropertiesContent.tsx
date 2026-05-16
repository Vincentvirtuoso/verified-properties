/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useCallback,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { properties } from "@/data/properties"; // now typed as Property[]
import { PropertyCard } from "@/components/property/PropertyCard";
import { LuFilter, LuX, LuSearch } from "react-icons/lu";
import { useDebounce } from "@/hooks/useDebounce";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
} from "@/utils/constants"; // unchanged, labels match new types
import { PropertyFilterState } from "@/types";
import { FilterSidebar } from "@/components/propertiesList/FilterSidebar";
import {
  FilterType,
  SortOption,
  useProperty,
  FILTER_OPTIONS,
} from "@/hooks/useProperty";
import { MobileFilterDrawer } from "@/components/propertiesList/MobileFilterDropdown";
import { Badge } from "@/components/ui";

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  } = useProperty();
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<PropertyFilterState>(DEFAULT_FILTERS);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentType = (searchParams.get("type") as FilterType) || "all";
  const searchParam = searchParams.get("search") || "";

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Sync search param with local state
  useEffect(() => {
    if (searchParam && !searchQuery) {
      setSearchQuery(searchParam);
    }
  }, [searchParam, searchQuery]);

  // Search suggestions (now only using title, description, location fields,
  // category/type/feature labels — no agent data)
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      const suggestions = new Set<string>();
      const q = debouncedSearchQuery.toLowerCase();

      properties.forEach((property) => {
        if (property.title.toLowerCase().includes(q))
          suggestions.add(property.title);
        if (property.description?.toLowerCase().includes(q))
          suggestions.add(property.description);

        // Location object
        if (property.location.city.toLowerCase().includes(q))
          suggestions.add(property.location.city);
        if (property.location.state.toLowerCase().includes(q))
          suggestions.add(property.location.state);
        if (property.location.address.toLowerCase().includes(q))
          suggestions.add(property.location.address);

        const typeLabel = PROPERTY_TYPE_LABELS[property.type].toLowerCase();
        if (typeLabel.includes(q))
          suggestions.add(PROPERTY_TYPE_LABELS[property.type]);

        const catLabel =
          PROPERTY_CATEGORY_LABELS[property.category].toLowerCase();
        if (catLabel.includes(q))
          suggestions.add(PROPERTY_CATEGORY_LABELS[property.category]);

        property.features?.forEach((f) => {
          const featLabel = PROPERTY_FEATURE_LABELS[f].toLowerCase();
          if (featLabel.includes(q))
            suggestions.add(PROPERTY_FEATURE_LABELS[f]);
        });
      });

      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearchQuery]);

  // Update URL search param
  const updateSearchParams = useCallback(
    (query: string) => {
      const params = new URLSearchParams(searchParams.toString());
      startTransition(() => {
        if (query) {
          params.set("search", query);
        } else {
          params.delete("search");
        }
        router.push(`/properties?${params.toString()}`, { scroll: false });
      });
    },
    [searchParams, router],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateSearchParams(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    updateSearchParams(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    updateSearchParams("");
    setSearchSuggestions([]);
  }, [updateSearchParams]);

  // Count active filters
  useEffect(() => {
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
    // Agent filter removed
    if (searchQuery) count++;
    setActiveFiltersCount(count);
  }, [
    DEFAULT_FILTERS.maxArea,
    DEFAULT_FILTERS.minArea,
    DEFAULT_FILTERS.priceRange,
    filters,
    searchQuery,
  ]);

  // Filter and sort properties
  const { filteredProperties, sortedProperties } = useMemo(() => {
    const filtered = properties.filter((property) => {
      // Search query
      if (debouncedSearchQuery) {
        const q = debouncedSearchQuery.toLowerCase();
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

      // Tab filter (all / rent / sale / deals)
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

      // Price range
      if (
        property.price < filters.priceRange[0] ||
        property.price > filters.priceRange[1]
      )
        return false;

      // Bedrooms
      if (filters.bedrooms !== "any") {
        const num = parseInt(filters.bedrooms);
        if (filters.bedrooms === "5+") {
          if (property.bedrooms < 5) return false;
        } else if (property.bedrooms !== num) return false;
      }

      // Bathrooms
      if (filters.bathrooms !== "any") {
        const num = parseInt(filters.bathrooms);
        if (filters.bathrooms === "5+") {
          if (property.bathrooms < 5) return false;
        } else if (property.bathrooms !== num) return false;
      }

      // Category
      if (filters.category !== "all" && property.category !== filters.category)
        return false;

      // Type
      if (filters.type.length > 0 && !filters.type.includes(property.type))
        return false;

      // Documents
      if (
        filters.documents.length > 0 &&
        !property.documents?.some((doc) => filters.documents.includes(doc.type))
      )
        return false;

      // Features
      if (filters.features.length > 0) {
        const propertyFeats = property.features ?? [];
        if (!filters.features.every((f) => propertyFeats.includes(f)))
          return false;
      }

      // Location – now checking city, state, address
      if (filters.location !== "all") {
        const locStr = filters.location.toLowerCase();
        const locationMatch =
          property.location.city.toLowerCase().includes(locStr) ||
          property.location.state.toLowerCase().includes(locStr) ||
          property.location.address.toLowerCase().includes(locStr);
        if (!locationMatch) return false;
      }

      // Area
      if (property.area) {
        if (property.area < filters.minArea || property.area > filters.maxArea)
          return false;
      }

      // Agent filter removed entirely
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "newest":
        default:
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      }
    });

    return { filteredProperties: filtered, sortedProperties: sorted };
  }, [currentType, sortBy, filters, debouncedSearchQuery]);

  // Tab switching (type filter)
  const handleTypeChange = (type: FilterType) => {
    const params = new URLSearchParams(searchParams.toString());
    startTransition(() => {
      if (type === "all") {
        params.delete("type");
      } else {
        params.set("type", type);
      }
      router.push(`/properties?${params.toString()}`, { scroll: false });
    });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  const handleFilterChange = useCallback(
    (newFilters: Partial<PropertyFilterState>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    [],
  );

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    clearSearch();
  }, [DEFAULT_FILTERS, clearSearch]);

  const removeFilter = useCallback(
    (filterKey: keyof PropertyFilterState | "search") => {
      if (filterKey === "search") {
        clearSearch();
      } else {
        setFilters((prev) => ({
          ...prev,
          [filterKey]: DEFAULT_FILTERS[filterKey],
        }));
      }
    },
    [DEFAULT_FILTERS, clearSearch],
  );

  // Highlight matched text in search suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-primary/20 text-primary font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 sm:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Properties
            </h1>
            <p className="text-muted-foreground mt-2 text-base sm:text-lg">
              Discover premium homes across Nigeria
            </p>
          </div>

          <div
            className="flex gap-2 mt-4 lg:mt-0 bg-background p-1.5 rounded-2xl border border-border text-sm shadow-sm"
            role="tablist"
            aria-label="Property type filter"
          >
            {FILTER_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleTypeChange(value)}
                role="tab"
                aria-selected={currentType === value}
                aria-controls="property-list"
                disabled={isPending}
                className={`
                  px-4 sm:px-7 py-2.5 sm:py-3 rounded-xl font-medium transition-all flex-1 whitespace-nowrap text-sm sm:text-base
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    currentType === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-2xl">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchSuggestions.length > 0 && setShowSuggestions(true)
                  }
                  placeholder="Search by city, address, property type..."
                  className="w-full pl-12 pr-12 py-3 bg-background border border-border rounded-2xl text-base
                           focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                           shadow-sm transition-all text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <LuX className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </form>

            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 mt-2 w-full max-w-2xl bg-popover rounded-xl border border-border shadow-lg overflow-hidden">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <LuSearch className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-popover-foreground">
                        {highlightMatch(suggestion, debouncedSearchQuery)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showSuggestions && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </div>

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
            <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-muted-foreground" aria-live="polite">
                    <span className="font-semibold text-foreground text-lg">
                      {sortedProperties.length}
                    </span>{" "}
                    {sortedProperties.length === 1 ? "property" : "properties"}{" "}
                    found
                    {debouncedSearchQuery && (
                      <span className="text-muted-foreground">
                        {" "}
                        for &quot;{debouncedSearchQuery}&quot;
                      </span>
                    )}
                  </p>

                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <LuFilter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <Badge variant="info" className="px-2 py-0 text-[10px]">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    aria-label="Sort properties by"
                    className="bg-background border border-border rounded-xl px-5 py-2.5 text-sm
                               appearance-none pr-10 cursor-pointer text-foreground
                               focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                               hover:border-border/80 transition-colors"
                  >
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground/80">
                      Active Filters:
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-primary hover:text-primary/80 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <Badge variant="info" className="cursor-pointer gap-1.5">
                        Search: {searchQuery}
                        <button
                          onClick={() => removeFilter("search")}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                          aria-label="Remove search filter"
                        >
                          <LuX className="w-3 h-3" />
                        </button>
                      </Badge>
                    )}
                    {filters.category !== "all" && (
                      <FilterTag
                        label={`Category: ${PROPERTY_CATEGORY_LABELS[filters.category]}`}
                        onRemove={() => removeFilter("category")}
                      />
                    )}
                    {filters.type.length > 0 && (
                      <FilterTag
                        label={`Type: ${filters.type.length} selected`}
                        onRemove={() => removeFilter("type")}
                      />
                    )}
                    {filters.documents.length > 0 && (
                      <FilterTag
                        label={`Documents: ${filters.documents.length} types`}
                        onRemove={() => removeFilter("documents")}
                      />
                    )}
                    {filters.features.length > 0 && (
                      <FilterTag
                        label={`Features: ${filters.features.length} selected`}
                        onRemove={() => removeFilter("features")}
                      />
                    )}
                    {filters.location !== "all" && (
                      <FilterTag
                        label={`Location: ${filters.location}`}
                        onRemove={() => removeFilter("location")}
                      />
                    )}
                    {filters.bedrooms !== "any" && (
                      <FilterTag
                        label={`${filters.bedrooms} ${filters.bedrooms === "1" ? "Bed" : "Beds"}`}
                        onRemove={() => removeFilter("bedrooms")}
                      />
                    )}
                    {filters.bathrooms !== "any" && (
                      <FilterTag
                        label={`${filters.bathrooms} ${filters.bathrooms === "1" ? "Bath" : "Baths"}`}
                        onRemove={() => removeFilter("bathrooms")}
                      />
                    )}
                    {(filters.priceRange[0] > DEFAULT_FILTERS.priceRange[0] ||
                      filters.priceRange[1] <
                        DEFAULT_FILTERS.priceRange[1]) && (
                      <FilterTag
                        label={`Price: ₦${(filters.priceRange[0] / 1000000).toFixed(1)}M - ₦${(filters.priceRange[1] / 1000000).toFixed(1)}M`}
                        onRemove={() => removeFilter("priceRange")}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>

            {isPending ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div
                  id="property-list"
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                >
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property._id} {...property} />
                  ))}
                </div>

                {sortedProperties.length === 0 && (
                  <div className="text-center py-16 bg-card rounded-2xl">
                    <div className="text-6xl mb-6">🔍</div>
                    <h3 className="text-2xl font-semibold text-foreground">
                      No properties found
                    </h3>
                    <p className="text-muted-foreground mt-3 mb-6">
                      {searchQuery
                        ? `No results for "${searchQuery}". Try different keywords or adjust your filters.`
                        : "Try adjusting your filters or check back later."}
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </>
            )}
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

// Reusable FilterTag – uses improved Badge component
function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Badge variant="info" className="cursor-pointer gap-1.5">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <LuX className="w-3.5 h-3.5" />
      </button>
    </Badge>
  );
}

// Skeleton unchanged
function PropertyCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-pulse">
      <div className="h-64 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-7 bg-muted rounded w-2/3" />
        <div className="h-6 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="flex gap-5 mt-5">
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-16" />
          <div className="h-5 bg-muted rounded w-16" />
        </div>
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-muted rounded-full" />
              <div className="h-4 bg-muted rounded w-24" />
            </div>
            <div className="h-4 bg-muted rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}
