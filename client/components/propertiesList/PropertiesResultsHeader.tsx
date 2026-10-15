"use client";

import type { ReactNode } from "react";
import { LuFilter } from "react-icons/lu";
import { Badge } from "@affilhomes/shared/ui";
import type { SortOption } from "@/hooks/useProperty";

interface PropertiesResultsHeaderProps {
  resultCount: number;
  debouncedSearchQuery: string;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  sortOptions: { value: SortOption; label: string }[];
  activeFiltersCount: number;
  onOpenMobileFilters: () => void;
  children?: ReactNode;
}

export function PropertiesResultsHeader({
  resultCount,
  debouncedSearchQuery,
  sortBy,
  onSortChange,
  sortOptions,
  activeFiltersCount,
  onOpenMobileFilters,
  children,
}: PropertiesResultsHeaderProps) {
  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-muted line-clamp-2" aria-live="polite">
            <span className="font-semibold text-foreground text-lg">
              {resultCount}
            </span>{" "}
            {resultCount === 1 ? "property" : "properties"} found
            {debouncedSearchQuery && (
              <span className="text-muted">
                {" "}
                for &quot;{debouncedSearchQuery}&quot;
              </span>
            )}
          </p>

          <button
            onClick={onOpenMobileFilters}
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
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            aria-label="Sort properties by"
            className="bg-background border border-border rounded-xl px-5 py-2.5 text-sm
                       appearance-none pr-10 cursor-pointer text-foreground
                       focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                       hover:border-border/80 transition-colors"
          >
            {sortOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
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

      {children}
    </div>
  );
}
