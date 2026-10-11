"use client";

import { FILTER_OPTIONS, FilterType } from "@/hooks/useProperty";

interface PropertiesHeaderProps {
  currentType: FilterType;
  onTypeChange: (type: FilterType) => void;
  isPending?: boolean;
}

export function PropertiesHeader({
  currentType,
  onTypeChange,
  isPending,
}: PropertiesHeaderProps) {
  return (
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
            onClick={() => onTypeChange(value)}
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
  );
}
