"use client";

import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
} from "@/utils/constants";
import {
  PropertyType,
  PropertyCategory,
  PropertyFeature,
} from "@/types/property";
import { PropertyFilterState } from "@/types";

interface AdvancedFiltersProps {
  filters: PropertyFilterState;
  onFilterChange: (filters: any) => void;
  locations: string[];
  propertyTypes: PropertyType[];
  allCategories: PropertyCategory[];
  allFeatures: PropertyFeature[];
  agents: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  onClearAll: () => void;
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  locations,
  propertyTypes,
  allCategories,
  allFeatures,
  agents,
  priceRange: [globalMinPrice, globalMaxPrice],
  areaRange: [globalMinArea, globalMaxArea],
  onClearAll,
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    location: true,
    category: true,
    propertyType: true,
    features: false,
    rooms: true,
    area: false,
    agent: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `₦${(price / 1000000).toFixed(1)}M`;
    return `₦${(price / 1000).toFixed(0)}K`;
  };

  return (
    <div className="">
      <div className="space-y-4">
        <FilterSection
          title="Price Range"
          expanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Min
                </label>
                <input
                  type="number"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    onFilterChange({
                      priceRange: [
                        Number(e.target.value),
                        filters.priceRange[1],
                      ],
                    })
                  }
                  min={globalMinPrice}
                  max={filters.priceRange[1]}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Max
                </label>
                <input
                  type="number"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    onFilterChange({
                      priceRange: [
                        filters.priceRange[0],
                        Number(e.target.value),
                      ],
                    })
                  }
                  min={filters.priceRange[0]}
                  max={globalMaxPrice}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-1">
              <input
                type="range"
                min={globalMinPrice}
                max={globalMaxPrice}
                step={Math.floor((globalMaxPrice - globalMinPrice) / 100)}
                value={filters.priceRange[1]}
                onChange={(e) =>
                  onFilterChange({
                    priceRange: [filters.priceRange[0], Number(e.target.value)],
                  })
                }
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{formatPrice(globalMinPrice)}</span>
                <span>{formatPrice(globalMaxPrice)}</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              Selected: {formatPrice(filters.priceRange[0])} -{" "}
              {formatPrice(filters.priceRange[1])}
            </div>
          </div>
        </FilterSection>

        <FilterSection
          title="Location"
          expanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc.length > 40 ? loc.substring(0, 40) + "..." : loc}
              </option>
            ))}
          </select>
        </FilterSection>

        <FilterSection
          title="Category"
          expanded={expandedSections.category}
          onToggle={() => toggleSection("category")}
        >
          <select
            value={filters.category}
            onChange={(e) =>
              onFilterChange({
                category: e.target.value as PropertyCategory | "all",
              })
            }
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {PROPERTY_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </FilterSection>

        <FilterSection
          title="Property Type"
          expanded={expandedSections.propertyType}
          onToggle={() => toggleSection("propertyType")}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {propertyTypes.map((typeKey) => (
              <label
                key={typeKey}
                className="flex items-center gap-2 cursor-pointer text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={filters.type.includes(typeKey)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.type, typeKey]
                      : filters.type.filter((t) => t !== typeKey);
                    onFilterChange({ type: newTypes });
                  }}
                  className="rounded border-border text-primary focus:ring-ring"
                />
                <span>{PROPERTY_TYPE_LABELS[typeKey]}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="Features"
          expanded={expandedSections.features}
          onToggle={() => toggleSection("features")}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allFeatures.map((feat) => (
              <label
                key={feat}
                className="flex items-center gap-2 cursor-pointer text-sm text-foreground"
              >
                <input
                  type="checkbox"
                  checked={filters.features.includes(feat)}
                  onChange={(e) => {
                    const newFeats = e.target.checked
                      ? [...filters.features, feat]
                      : filters.features.filter((f) => f !== feat);
                    onFilterChange({ features: newFeats });
                  }}
                  className="rounded border-border text-primary focus:ring-ring"
                />
                <span>{PROPERTY_FEATURE_LABELS[feat]}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection
          title="Rooms & Beds"
          expanded={expandedSections.rooms}
          onToggle={() => toggleSection("rooms")}
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => onFilterChange({ bedrooms: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="any">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-foreground mb-2 block">
                Bathrooms
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => onFilterChange({ bathrooms: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="any">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5+">5+</option>
              </select>
            </div>
          </div>
        </FilterSection>

        <FilterSection
          title="Area (m²)"
          expanded={expandedSections.area}
          onToggle={() => toggleSection("area")}
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Min
                </label>
                <input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) =>
                    onFilterChange({ minArea: Number(e.target.value) })
                  }
                  min={globalMinArea}
                  max={filters.maxArea}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  Max
                </label>
                <input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) =>
                    onFilterChange({ maxArea: Number(e.target.value) })
                  }
                  min={filters.minArea}
                  max={globalMaxArea}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center">
              {filters.minArea} - {filters.maxArea} m²
            </div>
          </div>
        </FilterSection>

        <FilterSection
          title="Listed By"
          expanded={expandedSections.agent}
          onToggle={() => toggleSection("agent")}
        >
          <select
            value={filters.agent}
            onChange={(e) => onFilterChange({ agent: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </FilterSection>

        <FilterSection
          title="Listed By"
          expanded={expandedSections.agent}
          onToggle={() => toggleSection("agent")}
        >
          <select
            value={filters.agent}
            onChange={(e) => onFilterChange({ agent: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
          >
            <option value="all">All Agents</option>
            {agents.map((agent) => (
              <option key={agent} value={agent}>
                {agent}
              </option>
            ))}
          </select>
        </FilterSection>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-3 hover:text-primary transition-colors"
      >
        <span className="font-medium text-foreground">{title}</span>
        {expanded ? (
          <LuChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <LuChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}
