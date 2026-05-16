"use client";

import { useMemo, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";
import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/utils/constants";
import {
  PropertyType,
  PropertyCategory,
  PropertyFeature,
  PropertyDocument,
  PropertyLocation,
} from "@/types/property";
import { PropertyFilterState } from "@/types";
import { Checkbox } from "../ui/Checkbox";
import { Slider } from "../ui/Slider";

interface AdvancedFiltersProps {
  filters: PropertyFilterState;
  onFilterChange: (filters: Partial<PropertyFilterState>) => void;
  locations: PropertyLocation[];
  propertyTypes: PropertyType[];
  allCategories: PropertyCategory[];
  allFeatures: PropertyFeature[];
  allDocuments: PropertyDocument[];
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
    documents: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(1)}M`;
    return `₦${(price / 1000).toFixed(0)}K`;
  };

  // FIXED: Adjusted to accept the PropertyLocation object directly
  const formatLocationLabel = (loc: PropertyLocation) => {
    if (!loc) return "";
    const label =
      loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.address;
    return label.length > 35 ? `${label.substring(0, 35)}...` : label;
  };

  const [docSearchTerm, setDocSearchTerm] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!docSearchTerm.trim()) return allDocuments;
    const lower = docSearchTerm.toLowerCase();
    return allDocuments.filter((doc) => {
      const label = DOCUMENT_TYPE_LABELS[doc.type].toLowerCase();
      const title = doc.title?.toLowerCase() ?? "";
      return label.includes(lower) || title.includes(lower);
    });
  }, [allDocuments, docSearchTerm]);

  const toggleDocumentType = (
    docType: PropertyDocument["type"],
    checked: boolean,
  ) => {
    const newDocs = checked
      ? [...filters.documents, docType]
      : filters.documents.filter((t) => t !== docType);
    onFilterChange({ documents: newDocs });
  };

  const selectAllVisibleDocs = (checked: boolean) => {
    const visibleTypes = filteredDocuments.map((doc) => doc.type);
    const newDocs = checked
      ? Array.from(new Set([...filters.documents, ...visibleTypes]))
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
          onChange={(value) => onFilterChange({ priceRange: value })}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {formatPrice(filters.priceRange[0])} –{" "}
          {formatPrice(filters.priceRange[1])}
        </p>
      </FilterSection>

      {/* FIXED LOCATION SECTION */}
      <FilterSection
        title="Location"
        expanded={expandedSections.location}
        onToggle={() => toggleSection("location")}
      >
        <div className="relative">
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ location: e.target.value })}
            className="w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-10 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          >
            <option value="all">📍 All Locations</option>
            {locations.map((loc, index) => {
              // Ensure uniqueness in selection state matching what your layout mapping tracks
              const selectionValue =
                loc.city && loc.state
                  ? `${loc.city}, ${loc.state}`
                  : loc.address;
              return (
                <option
                  key={`${selectionValue}-${index}`}
                  value={selectionValue}
                >
                  {formatLocationLabel(loc)}
                </option>
              );
            })}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
            <LuChevronDown className="h-4 w-4" />
          </div>
        </div>
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
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
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
        <div className="max-h-48 space-y-2 overflow-y-auto">
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
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {allFeatures.map((feat) => (
            <Checkbox
              key={feat}
              label={PROPERTY_FEATURE_LABELS[feat]}
              checked={filters.features.includes(feat)}
              onChange={(e) => {
                const newFeats = e.target.checked
                  ? [...filters.features, feat]
                  : filters.features.filter((f) => f !== feat);
                onFilterChange({ features: newFeats });
              }}
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
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Bedrooms
            </label>
            <select
              value={filters.bedrooms}
              onChange={(e) => onFilterChange({ bedrooms: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="any">Any</option>
              {[1, 2, 3, 4, "5+"].map((n) => (
                <option key={n} value={n.toString()}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Bathrooms
            </label>
            <select
              value={filters.bathrooms}
              onChange={(e) => onFilterChange({ bathrooms: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="any">Any</option>
              {[1, 2, 3, 4, "5+"].map((n) => (
                <option key={n} value={n.toString()}>
                  {n}
                </option>
              ))}
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
              <label className="mb-1 block text-xs text-muted-foreground">
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-muted-foreground">
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {filters.minArea} – {filters.maxArea} m²
          </p>
        </div>
      </FilterSection>

      <FilterSection
        title="Documents"
        expanded={expandedSections.documents}
        onToggle={() => toggleSection("documents")}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search documents..."
              value={docSearchTerm}
              onChange={(e) => setDocSearchTerm(e.target.value)}
              className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              onClick={clearAllDocs}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary transition-colors"
            >
              Clear
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={(e) => selectAllVisibleDocs(e.target.checked)}
              className="rounded border-border text-primary focus:ring-ring"
            />
            Select all visible
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
                  label={doc.title || DOCUMENT_TYPE_LABELS[doc.type]}
                  checked={filters.documents.includes(doc.type)}
                  onChange={(e) =>
                    toggleDocumentType(doc.type, e.target.checked)
                  }
                />
              ))
            )}
          </div>
        </div>
      </FilterSection>
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
        className="flex w-full items-center justify-between py-1 hover:text-primary transition-colors"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        {expanded ? (
          <LuChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <LuChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {expanded && <div className="mt-3">{children}</div>}
    </div>
  );
}
