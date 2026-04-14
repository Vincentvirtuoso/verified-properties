"use client";

import { useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

interface AdvancedFiltersProps {
  filters: {
    priceRange: [number, number];
    bedrooms: string;
    bathrooms: string;
    propertyType: string[];
    location: string;
    minArea: number;
    maxArea: number;
    agent: string;
  };
  onFilterChange: (filters: any) => void;
  locations: string[];
  propertyTypes: string[];
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
  agents,
  priceRange: [globalMinPrice, globalMaxPrice],
  areaRange: [globalMinArea, globalMaxArea],
  onClearAll,
}: AdvancedFiltersProps) {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    location: true,
    propertyType: true,
    rooms: true,
    area: false,
    agent: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `₦${(price / 1000000).toFixed(1)}M`;
    }
    return `₦${(price / 1000).toFixed(0)}K`;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        <button
          onClick={onClearAll}
          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-4">
        {/* Price Range */}
        <FilterSection
          title="Price Range"
          expanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
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
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
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
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{formatPrice(globalMinPrice)}</span>
                <span>{formatPrice(globalMaxPrice)}</span>
              </div>
            </div>
            <div className="text-sm text-gray-600 text-center">
              Selected: {formatPrice(filters.priceRange[0])} -{" "}
              {formatPrice(filters.priceRange[1])}
            </div>
          </div>
        </FilterSection>

        {/* Location */}
        <FilterSection
          title="Location"
          expanded={expandedSections.location}
          onToggle={() => toggleSection("location")}
        >
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location.length > 40
                  ? location.substring(0, 40) + "..."
                  : location}
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          expanded={expandedSections.propertyType}
          onToggle={() => toggleSection("propertyType")}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {propertyTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.propertyType.includes(type)}
                  onChange={(e) => {
                    const newTypes = e.target.checked
                      ? [...filters.propertyType, type]
                      : filters.propertyType.filter((t: string) => t !== type);
                    onFilterChange({ propertyType: newTypes });
                  }}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Rooms */}
        <FilterSection
          title="Rooms & Beds"
          expanded={expandedSections.rooms}
          onToggle={() => toggleSection("rooms")}
        >
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-2 block">
                Bedrooms
              </label>
              <select
                value={filters.bedrooms}
                onChange={(e) => onFilterChange({ bedrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
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
              <label className="text-sm text-gray-700 mb-2 block">
                Bathrooms
              </label>
              <select
                value={filters.bathrooms}
                onChange={(e) => onFilterChange({ bathrooms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
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

        {/* Area */}
        <FilterSection
          title="Area (m²)"
          expanded={expandedSections.area}
          onToggle={() => toggleSection("area")}
        >
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Min</label>
                <input
                  type="number"
                  value={filters.minArea}
                  onChange={(e) =>
                    onFilterChange({ minArea: Number(e.target.value) })
                  }
                  min={globalMinArea}
                  max={filters.maxArea}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">Max</label>
                <input
                  type="number"
                  value={filters.maxArea}
                  onChange={(e) =>
                    onFilterChange({ maxArea: Number(e.target.value) })
                  }
                  min={filters.minArea}
                  max={globalMaxArea}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600 text-center">
              {filters.minArea} - {filters.maxArea} m²
            </div>
          </div>
        </FilterSection>

        {/* Agent */}
        <FilterSection
          title="Listed By"
          expanded={expandedSections.agent}
          onToggle={() => toggleSection("agent")}
        >
          <select
            value={filters.agent}
            onChange={(e) => onFilterChange({ agent: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
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
    <div className="border-b border-gray-100 pb-4 last:border-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-3 hover:text-violet-600 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {expanded ? (
          <LuChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <LuChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && children}
    </div>
  );
}
