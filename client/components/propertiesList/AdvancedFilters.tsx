"use client";

import { useMemo, useState } from "react";
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

import {
  PROPERTY_TYPE_LABELS,
  PROPERTY_CATEGORY_LABELS,
  PROPERTY_FEATURE_LABELS,
  DOCUMENT_TYPE_LABELS,
} from "@/utils/constants";
import type {
  PropertyType,
  PropertyCategory,
  PropertyFeature,
  PropertyDocument,
  PropertyLocation,
} from "@/types/property";
import type { PropertyFilterState } from "@/types";
import { cn } from "@/lib/utils";

import { Checkbox } from "../ui/Checkbox";
import { Slider } from "../ui/Slider";

const fieldClass = cn(
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm",
  "text-foreground outline-none transition-all",
  "placeholder:text-muted-foreground/60",
  "hover:border-border/80",
  "focus:border-primary focus:ring-4 focus:ring-primary/10",
);

const ROOM_OPTIONS = ["1", "2", "3", "4", "5+"] as const;

function formatPrice(price: number) {
  if (price >= 1_000_000) return `₦${(price / 1_000_000).toFixed(1)}M`;
  return `₦${(price / 1000).toFixed(0)}K`;
}

function formatLocationLabel(loc: PropertyLocation) {
  if (!loc) return "";
  const label =
    loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.address;
  return label.length > 35 ? `${label.substring(0, 35)}...` : label;
}

function locationValue(loc: PropertyLocation) {
  return loc.city && loc.state ? `${loc.city}, ${loc.state}` : loc.address;
}

function toggleArrayItem<T>(arr: T[], item: T, checked: boolean): T[] {
  return checked ? [...arr, item] : arr.filter((x) => x !== item);
}

function SelectField({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(fieldClass, "appearance-none pr-10")}
      >
        {children}
      </select>
      <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
    <section className="border-b border-border/70 py-4 first:pt-0 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group flex w-full items-center justify-between rounded-lg text-left"
      >
        <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
          {title}
        </span>
        <span className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
          {expanded ? (
            <LuChevronUp className="h-4 w-4" />
          ) : (
            <LuChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </section>
  );
}

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

  const [docSearchTerm, setDocSearchTerm] = useState("");

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredDocuments = useMemo(() => {
    if (!docSearchTerm.trim()) return allDocuments;
    const lower = docSearchTerm.toLowerCase();
    return allDocuments.filter((doc) => {
      const label = DOCUMENT_TYPE_LABELS[doc.type].toLowerCase();
      const title = doc.title?.toLowerCase() ?? "";
      return label.includes(lower) || title.includes(lower);
    });
  }, [allDocuments, docSearchTerm]);

  const allVisibleSelected =
    filteredDocuments.length > 0 &&
    filteredDocuments.every((doc) => filters.documents.includes(doc.type));

  const toggleDocumentType = (
    docType: PropertyDocument["type"],
    checked: boolean,
  ) => {
    onFilterChange({
      documents: toggleArrayItem(filters.documents, docType, checked),
    });
  };

  const selectAllVisibleDocs = (checked: boolean) => {
    const visibleTypes = filteredDocuments.map((doc) => doc.type);
    const next = checked
      ? Array.from(new Set([...filters.documents, ...visibleTypes]))
      : filters.documents.filter((t) => !visibleTypes.includes(t));
    onFilterChange({ documents: next });
  };

  const clearAllDocs = () => onFilterChange({ documents: [] });

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

      <FilterSection
        title="Location"
        expanded={expandedSections.location}
        onToggle={() => toggleSection("location")}
      >
        <SelectField
          value={filters.location}
          onChange={(value) => onFilterChange({ location: value })}
        >
          <option value="all">All Locations</option>
          {locations.map((loc, index) => {
            const value = locationValue(loc);
            return (
              <option key={`${value}-${index}`} value={value}>
                {formatLocationLabel(loc)}
              </option>
            );
          })}
        </SelectField>
      </FilterSection>

      <FilterSection
        title="Category"
        expanded={expandedSections.category}
        onToggle={() => toggleSection("category")}
      >
        <SelectField
          value={filters.category}
          onChange={(value) =>
            onFilterChange({ category: value as PropertyCategory | "all" })
          }
        >
          <option value="all">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {PROPERTY_CATEGORY_LABELS[cat]}
            </option>
          ))}
        </SelectField>
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
              onChange={(e) =>
                onFilterChange({
                  type: toggleArrayItem(
                    filters.type,
                    typeKey,
                    e.target.checked,
                  ),
                })
              }
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
              onChange={(e) =>
                onFilterChange({
                  features: toggleArrayItem(
                    filters.features,
                    feat,
                    e.target.checked,
                  ),
                })
              }
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
            <SelectField
              value={filters.bedrooms}
              onChange={(value) => onFilterChange({ bedrooms: value })}
            >
              <option value="any">Any</option>
              {ROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Bathrooms
            </label>
            <SelectField
              value={filters.bathrooms}
              onChange={(value) => onFilterChange({ bathrooms: value })}
            >
              <option value="any">Any</option>
              {ROOM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </SelectField>
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
                className={fieldClass}
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
                className={fieldClass}
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
              className={cn(fieldClass, "flex-1")}
            />
            <button
              type="button"
              onClick={clearAllDocs}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
            >
              Clear
            </button>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={allVisibleSelected}
              onChange={(e) => selectAllVisibleDocs(e.target.checked)}
            />
            Select all
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
