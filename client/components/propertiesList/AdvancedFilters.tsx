"use client";

import { useMemo, useState } from "react";
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
  PropertyDocument,
} from "@/types/property";
import { PropertyFilterState } from "@/types";
import { Checkbox } from "../ui/Checkbox";
import { Slider } from "../ui/Slider";

interface AdvancedFiltersProps {
  filters: PropertyFilterState;
  onFilterChange: (filters: Partial<PropertyFilterState>) => void;
  locations: string[];
  propertyTypes: PropertyType[];
  allCategories: PropertyCategory[];
  allFeatures: PropertyFeature[];
  allDocuments: PropertyDocument[];
  agents: string[];
  priceRange: [number, number];
  areaRange: [number, number];
}

export function AdvancedFilters({
  filters,
  onFilterChange,
  locations,
  propertyTypes,
  allCategories,
  allFeatures,
  agents,
  allDocuments,
  priceRange: [globalMinPrice, globalMaxPrice],
  areaRange: [globalMinArea, globalMaxArea],
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
    documents: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `₦${(price / 1000000).toFixed(1)}M`;
    return `₦${(price / 1000).toFixed(0)}K`;
  };

  const [docSearchTerm, setDocSearchTerm] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!docSearchTerm.trim()) return allDocuments;
    const lower = docSearchTerm.toLowerCase();
    return allDocuments.filter((doc) =>
      doc?.type.toLowerCase().includes(lower),
    );
  }, [allDocuments, docSearchTerm]);

  const toggleDocumentType = (docType: string, checked: boolean) => {
    const newDocs = checked
      ? [...filters.documents, docType]
      : filters.documents.filter((t) => t !== docType);
    onFilterChange({ documents: newDocs });
  };

  const selectAllVisibleDocs = (checked: boolean) => {
    const visibleTypes = filteredDocuments.map((doc) => doc.type);
    const newDocs = checked
      ? [
          ...(new Set([
            ...filters.documents,
            ...visibleTypes,
          ]) as unknown as PropertyDocument["type"][]),
        ]
      : filters.documents.filter((t) => !visibleTypes.includes(t));
    onFilterChange({ documents: newDocs });
  };

  const clearAllDocs = () => {
    onFilterChange({ documents: [] });
  };

  const allVisibleSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => filters.documents.includes(doc.type));

  return (
    <div className="pr-2">
      <div className="space-y-4">
        <FilterSection
          title="Price Range"
          expanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <Slider
            min={globalMinPrice}
            max={globalMaxPrice}
            step={Math.floor((globalMaxPrice - globalMinPrice) / 100)}
            value={filters.priceRange}
            onChange={(value) =>
              onFilterChange({
                priceRange: value,
              })
            }
          />
          <div className="text-sm text-muted-foreground text-center mt-4">
            Selected: {formatPrice(filters.priceRange[0])} -{" "}
            {formatPrice(filters.priceRange[1])}
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
              <Checkbox
                key={typeKey}
                label={PROPERTY_TYPE_LABELS[typeKey]}
                checked={filters.type.includes(typeKey)}
                onChange={(e) => {
                  const newTypes = e.target.checked
                    ? [...filters.type, typeKey]
                    : filters.type.filter((t) => t !== typeKey);
                  onFilterChange({ type: newTypes });
                }}
              />
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
              <Checkbox
                label={PROPERTY_FEATURE_LABELS[feat]}
                key={feat}
                checked={filters.features.includes(feat)}
                onChange={(e) => {
                  const newFeats = e.target.checked
                    ? [...filters.features, feat]
                    : filters.features.filter((f) => f !== feat);
                  onFilterChange({ features: newFeats });
                }}
                className="rounded border-border text-primary focus:ring-ring"
              />
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
          title="Documents"
          expanded={expandedSections.documents} // ✅ fixed key
          onToggle={() => toggleSection("documents")} // ✅ fixed
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search documents..."
                value={docSearchTerm}
                onChange={(e) => setDocSearchTerm(e.target.value)}
                className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
              <button
                onClick={clearAllDocs}
                className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
              >
                Clear
              </button>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={(e) => selectAllVisibleDocs(e.target.checked)}
                className="rounded border-border"
              />
              <span>Select all visible</span>
            </label>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded border border-border p-2">
              {filteredDocuments.length === 0 ? (
                <p className="py-2 text-center text-sm text-muted-foreground">
                  {docSearchTerm
                    ? "No matching documents"
                    : "No documents available"}
                </p>
              ) : (
                filteredDocuments.map((doc) => (
                  <Checkbox
                    key={doc.id ?? doc.type}
                    label={doc.title}
                    checked={filters.documents.includes(doc.type)}
                    onChange={(e) =>
                      toggleDocumentType(doc.type, e.target.checked)
                    }
                    className="rounded border-border text-primary focus:ring-ring"
                  />
                ))
              )}
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
