"use client";

import {
  useState,
  useEffect,
  useMemo,
  useTransition,
  useCallback,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { properties } from "@/data/properties";
import { PropertyCard } from "@/components/cards/PropertyCard";
import { AdvancedFilters } from "@/components/common/AdvancedFilters";
import { LuFilter, LuX, LuSearch } from "react-icons/lu";
import { useDebounce } from "@/hooks/useDebounce";

type ListingType = "all" | "rent" | "sale";
type SortOption = "newest" | "price-low" | "price-high";

interface FilterState {
  priceRange: [number, number];
  bedrooms: string;
  bathrooms: string;
  propertyType: string[];
  location: string;
  minArea: number;
  maxArea: number;
  agent: string;
}

const FILTER_OPTIONS: { value: ListingType; label: string }[] = [
  { value: "all", label: "All Properties" },
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

const LOCATIONS = [...new Set(properties.map((p) => p.location))].sort();
const PROPERTY_TYPES = [...new Set(properties.map((p) => p.type))].sort();
const AGENTS = [
  ...new Set(properties.map((p) => p.agent?.name).filter(Boolean)),
].sort() as string[];

const PRICE_MIN = Math.min(...properties.map((p) => p.price));
const PRICE_MAX = Math.max(...properties.map((p) => p.price));
const AREA_MIN = Math.min(...properties.map((p) => p.area || 0));
const AREA_MAX = Math.max(...properties.map((p) => p.area || 0));

const DEFAULT_FILTERS: FilterState = {
  priceRange: [PRICE_MIN, PRICE_MAX],
  bedrooms: "any",
  bathrooms: "any",
  propertyType: [],
  location: "all",
  minArea: AREA_MIN,
  maxArea: AREA_MAX,
  agent: "all",
};

export default function PropertiesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const currentType = (searchParams.get("type") as ListingType) || "all";
  const searchParam = searchParams.get("search") || "";

  // Debounce search to avoid excessive filtering
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Initialize search from URL
  useEffect(() => {
    if (searchParam && !searchQuery) {
      setSearchQuery(searchParam);
    }
  }, [searchParam]);

  // Generate search suggestions
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      const suggestions = new Set<string>();

      properties.forEach((property) => {
        const searchLower = debouncedSearchQuery.toLowerCase();

        // Add matching titles
        if (property.title.toLowerCase().includes(searchLower)) {
          suggestions.add(property.title);
        }

        // Add matching locations
        if (property.location.toLowerCase().includes(searchLower)) {
          suggestions.add(property.location);
        }

        // Add matching property types
        if (property.type.toLowerCase().includes(searchLower)) {
          suggestions.add(property.type);
        }
      });

      setSearchSuggestions(Array.from(suggestions).slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedSearchQuery]);

  // Update URL with search query
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

  const clearSearch = () => {
    setSearchQuery("");
    updateSearchParams("");
    setSearchSuggestions([]);
  };

  useEffect(() => {
    let count = 0;
    if (
      filters.priceRange[0] > DEFAULT_FILTERS.priceRange[0] ||
      filters.priceRange[1] < DEFAULT_FILTERS.priceRange[1]
    )
      count++;
    if (filters.bedrooms !== "any") count++;
    if (filters.bathrooms !== "any") count++;
    if (filters.propertyType.length > 0) count++;
    if (filters.location !== "all") count++;
    if (
      filters.minArea > DEFAULT_FILTERS.minArea ||
      filters.maxArea < DEFAULT_FILTERS.maxArea
    )
      count++;
    if (filters.agent !== "all") count++;
    if (searchQuery) count++;
    setActiveFiltersCount(count);
  }, [filters, searchQuery]);

  const { filteredProperties, sortedProperties } = useMemo(() => {
    const filtered = properties.filter((property) => {
      // Search filter
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const searchableText = [
          property.title,
          property.location,
          property.type,
          property.description,
          property.agent?.name,
          property.agent?.company,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (currentType !== "all" && property.listingType !== currentType)
        return false;

      // Price filter
      if (
        property.price < filters.priceRange[0] ||
        property.price > filters.priceRange[1]
      )
        return false;

      // Bedrooms filter
      if (filters.bedrooms !== "any") {
        const bedroomNum = parseInt(filters.bedrooms);
        if (filters.bedrooms === "5+") {
          if (property.bedrooms < 5) return false;
        } else {
          if (property.bedrooms !== bedroomNum) return false;
        }
      }

      // Bathrooms filter
      if (filters.bathrooms !== "any") {
        const bathroomNum = parseInt(filters.bathrooms);
        if (filters.bathrooms === "5+") {
          if (property.bathrooms < 5) return false;
        } else {
          if (property.bathrooms !== bathroomNum) return false;
        }
      }

      // Property type filter
      if (
        filters.propertyType.length > 0 &&
        !filters.propertyType.includes(property.type)
      ) {
        return false;
      }

      // Location filter
      if (
        filters.location !== "all" &&
        property.location !== filters.location
      ) {
        return false;
      }

      // Area filter
      if (property.area) {
        if (property.area < filters.minArea || property.area > filters.maxArea)
          return false;
      }

      // Agent filter
      if (filters.agent !== "all" && property.agent?.name !== filters.agent) {
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
        default:
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
      }
    });

    return { filteredProperties: filtered, sortedProperties: sorted };
  }, [currentType, sortBy, filters, debouncedSearchQuery]);

  const handleTypeChange = (type: ListingType) => {
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

  const handleFilterChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    clearSearch();
  }, []);

  const removeFilter = useCallback(
    (filterKey: keyof FilterState | "search") => {
      if (filterKey === "search") {
        clearSearch();
      } else {
        setFilters((prev) => ({
          ...prev,
          [filterKey]: DEFAULT_FILTERS[filterKey],
        }));
      }
    },
    [],
  );

  // Highlight matching text in suggestions
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;

    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-violet-100 text-violet-900 font-medium">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 sm:mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Properties
            </h1>
            <p className="text-gray-600 mt-2 text-base sm:text-lg">
              Discover premium homes across Nigeria
            </p>
          </div>

          <div
            className="flex gap-2 mt-4 lg:mt-0 bg-white p-1.5 rounded-2xl border border-gray-200 text-sm shadow-sm"
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
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    currentType === value
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() =>
                    searchSuggestions.length > 0 && setShowSuggestions(true)
                  }
                  placeholder="Search by location, property type, or keywords..."
                  className="w-full pl-12 pr-12 py-3 bg-white border border-gray-200 rounded-2xl text-base
                           focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent
                           shadow-sm transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    aria-label="Clear search"
                  >
                    <LuX className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 mt-2 w-full max-w-2xl bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <LuSearch className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-700">
                        {highlightMatch(suggestion, debouncedSearchQuery)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Click outside to close suggestions */}
            {showSuggestions && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowSuggestions(false)}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24">
              <AdvancedFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                locations={LOCATIONS}
                propertyTypes={PROPERTY_TYPES}
                agents={AGENTS}
                priceRange={[PRICE_MIN, PRICE_MAX]}
                areaRange={[AREA_MIN, AREA_MAX]}
                onClearAll={clearAllFilters}
              />
            </div>
          </aside>

          <div className="flex-1">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <p
                    className="text-gray-600"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <span className="font-semibold text-gray-900 text-lg">
                      {sortedProperties.length}
                    </span>{" "}
                    {sortedProperties.length === 1 ? "property" : "properties"}{" "}
                    found
                    {debouncedSearchQuery && (
                      <span className="text-gray-500">
                        {" "}
                        for "{debouncedSearchQuery}"
                      </span>
                    )}
                  </p>

                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors"
                  >
                    <LuFilter className="w-4 h-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-violet-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={handleSortChange}
                    aria-label="Sort properties by"
                    className="bg-white border border-gray-200 rounded-xl px-5 py-2.5 text-sm 
                               appearance-none pr-10 cursor-pointer
                               focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent
                               hover:border-gray-300 transition-colors"
                  >
                    {SORT_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
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
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Active Filters:
                    </span>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <FilterTag
                        label={`Search: ${searchQuery}`}
                        onRemove={() => removeFilter("search")}
                      />
                    )}
                    {filters.location !== "all" && (
                      <FilterTag
                        label={`Location: ${filters.location.split(",")[0]}`}
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
                    {filters.propertyType.length > 0 && (
                      <FilterTag
                        label={`Type: ${filters.propertyType.length} selected`}
                        onRemove={() => removeFilter("propertyType")}
                      />
                    )}
                    {filters.agent !== "all" && (
                      <FilterTag
                        label={`Agent: ${filters.agent}`}
                        onRemove={() => removeFilter("agent")}
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
              <div
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                aria-label="Loading properties"
              >
                {[...Array(6)].map((_, i) => (
                  <PropertyCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div
                  id="property-list"
                  role="region"
                  aria-label={`${sortedProperties.length} properties found`}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {sortedProperties.map((property) => (
                    <PropertyCard key={property._id} {...property} />
                  ))}
                </div>

                {sortedProperties.length === 0 && (
                  <div
                    className="text-center py-16 bg-white rounded-2xl"
                    role="status"
                    aria-label="No properties found"
                  >
                    <div className="text-6xl mb-6" aria-hidden="true">
                      🔍
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-800">
                      No properties found
                    </h3>
                    <p className="text-gray-500 mt-3 mb-6">
                      {searchQuery
                        ? `No results for "${searchQuery}". Try different keywords or adjust your filters.`
                        : "Try adjusting your filters or check back later."}
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
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
          propertyTypes={PROPERTY_TYPES}
          agents={AGENTS}
          priceRange={[PRICE_MIN, PRICE_MAX]}
          areaRange={[AREA_MIN, AREA_MAX]}
          onClearAll={clearAllFilters}
          onClose={() => setShowMobileFilters(false)}
        />
      )}
    </div>
  );
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 text-sm rounded-lg">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-violet-100 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <LuX className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 animate-pulse">
      <div className="h-64 bg-gray-200" />
      <div className="p-5 space-y-3">
        <div className="h-7 bg-gray-200 rounded w-2/3" />
        <div className="h-6 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="flex gap-5 mt-5">
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
          <div className="h-5 bg-gray-200 rounded w-16" />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded-full" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileFilterDrawer({
  filters,
  onFilterChange,
  locations,
  propertyTypes,
  agents,
  priceRange,
  areaRange,
  onClearAll,
  onClose,
}: any) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <AdvancedFilters
            filters={filters}
            onFilterChange={onFilterChange}
            locations={locations}
            propertyTypes={propertyTypes}
            agents={agents}
            priceRange={priceRange}
            areaRange={areaRange}
            onClearAll={onClearAll}
          />
        </div>
      </div>
    </div>
  );
}
