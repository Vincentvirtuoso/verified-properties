"use client";

import { useMemo, useState } from "react";
import { Field } from "@affilhomes/shared/ui/Field";
import { Checkbox } from "@affilhomes/shared/ui/Checkbox";
import { SectionHeader } from "@affilhomes/shared/ui/SectionHeader";
import {
  LuBanknote,
  LuLayoutGrid,
  LuStar,
  LuSearch,
  LuX,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import type { PropertyFeature } from "@affilhomes/shared/types";
import { FEATURE_GROUPS } from "./constants";
import { formatPrice } from "@/utils";

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

const MAX_VISIBLE_CHIPS = 10;

interface StepDetailsProps {
  formData: ListPropertyFormData;
  errors: Partial<Record<keyof ListPropertyFormData, string>>;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
}

export function StepDetails({
  formData,
  errors,
  updateField,
}: StepDetailsProps) {
  const [search, setSearch] = useState("");
  const [showAllChips, setShowAllChips] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      FEATURE_GROUPS.map((g) => [g.id, g.defaultOpen ?? false]),
    ),
  );

  const selectedSet = useMemo(
    () => new Set(formData.features),
    [formData.features],
  );

  const toggleFeature = (feature: PropertyFeature) => {
    const current = formData.features;
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    updateField("features", next);
  };

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  function getPricePreview(amount: string, currency: string): string | null {
    if (!amount) return null;
    const num = Number(amount);
    if (Number.isNaN(num) || num <= 0) return null;
    return formatPrice(num, { currency });
  }

  const pricePreview = getPricePreview(formData.price, formData.currency);

  const isSearching = search.trim().length > 0;

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();

    const category = (formData as { category?: string }).category;

    return FEATURE_GROUPS.filter(
      (g) =>
        !g.categories || !category || g.categories.includes(category as never),
    )
      .map((g) =>
        q
          ? {
              ...g,
              items: g.items.filter((i) => i.label.toLowerCase().includes(q)),
            }
          : g,
      )
      .filter((g) => g.items.length > 0);
  }, [search, formData]);

  const selectedFeatures = useMemo(() => {
    const all = FEATURE_GROUPS.flatMap((g) => g.items);
    return all.filter((f) => selectedSet.has(f.value));
  }, [selectedSet]);

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuBanknote}
          title="Pricing"
          description="Set your asking price and currency"
        />

        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Asking Price <span className="ml-0.5 text-destructive">*</span>
            </label>

            <div
              className={`flex overflow-hidden rounded-xl border bg-background transition-all ${
                errors.price
                  ? "border-destructive focus-within:border-destructive focus-within:ring-1 focus-within:ring-destructive"
                  : "border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-ring"
              }`}
            >
              <div className="relative shrink-0">
                <select
                  aria-label="Currency"
                  value={formData.currency}
                  onChange={(e) => updateField("currency", e.target.value)}
                  className="h-full cursor-pointer appearance-none border-r border-border bg-subtle/50 py-3 pl-4 pr-8 text-sm font-semibold text-foreground transition-colors hover:bg-subtle/70 focus:outline-none"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <LuChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              </div>

              <input
                id="price"
                name="price"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={formData.price}
                onChange={(e) =>
                  updateField("price", e.target.value.replace(/[^0-9]/g, ""))
                }
                aria-invalid={errors.price ? true : undefined}
                aria-describedby={
                  errors.price ? "price-error" : "price-preview"
                }
                className="flex-1 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
              />
            </div>

            {errors.price ? (
              <p
                id="price-error"
                role="alert"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-destructive"
              >
                <svg
                  className="h-3.5 w-3.5 shrink-0"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
                {errors.price}
              </p>
            ) : pricePreview ? (
              <p
                id="price-preview"
                className="mt-1.5 text-xs text-muted place-self-end"
              >
                {pricePreview}
              </p>
            ) : null}
          </div>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 transition-all ${
              formData.negotiable
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/30"
            }`}
          >
            <Checkbox
              id="negotiable"
              checked={formData.negotiable}
              onChange={(e) => updateField("negotiable", e.target.checked)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                Price is negotiable
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Show buyers you're open to reasonable offers
              </p>
            </div>
          </label>
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuLayoutGrid}
          title="Property Specs"
          description="Enter the size and room configuration"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Bedrooms"
            name="bedrooms"
            type="number"
            placeholder="0"
            value={formData.bedrooms}
            onChange={(e) => updateField("bedrooms", e.target.value)}
            required
            error={errors.bedrooms}
            scrollOnError
          />
          <Field
            label="Bathrooms"
            name="bathrooms"
            type="number"
            placeholder="0"
            value={formData.bathrooms}
            onChange={(e) => updateField("bathrooms", e.target.value)}
            required
            scrollOnError
            error={errors.bathrooms}
          />
          <Field
            label="Area (sqm)"
            name="area"
            type="number"
            placeholder="Optional"
            value={formData.area}
            onChange={(e) => updateField("area", e.target.value)}
            scrollOnError
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuStar}
          title="Features & Amenities"
          description={
            formData.features.length > 0
              ? `${formData.features.length} selected`
              : "Select all features that apply to this property"
          }
        />

        {selectedFeatures.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              {(showAllChips
                ? selectedFeatures
                : selectedFeatures.slice(0, MAX_VISIBLE_CHIPS)
              ).map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => toggleFeature(f.value)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-background px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {f.label}
                    <LuX className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </button>
                );
              })}

              {selectedFeatures.length > MAX_VISIBLE_CHIPS && (
                <button
                  type="button"
                  onClick={() => setShowAllChips((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-primary/40 bg-background px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  {showAllChips ? (
                    <>
                      Show less
                      <LuChevronUp className="h-3 w-3" />
                    </>
                  ) : (
                    <>
                      +{selectedFeatures.length - MAX_VISIBLE_CHIPS} more
                      <LuChevronDown className="h-3 w-3" />
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  updateField("features", []);
                  setShowAllChips(false);
                }}
                className="text-xs text-muted underline hover:text-destructive"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        <div className="relative mt-4">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search features…"
            className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-10 text-sm text-foreground placeholder:text-muted transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              <LuX className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mt-3 space-y-2">
          {filteredGroups.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">
              No features match &ldquo;{search}&rdquo;
            </p>
          )}

          {filteredGroups.map((group) => {
            const isOpen = isSearching || openGroups[group.id];
            const selectedInGroup = group.items.filter((i) =>
              selectedSet.has(i.value),
            ).length;
            const GroupIcon = group.icon;

            return (
              <div
                key={group.id}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/15"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      selectedInGroup > 0
                        ? "bg-primary/10 text-primary"
                        : "bg-muted/30 text-muted"
                    }`}
                  >
                    <GroupIcon className="h-4 w-4" />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {group.title}
                      </span>
                      {selectedInGroup > 0 && (
                        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">
                          {selectedInGroup}
                        </span>
                      )}
                    </span>
                    {group.description && (
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {group.description}
                      </span>
                    )}
                  </span>

                  <LuChevronDown
                    className={`h-4 w-4 shrink-0 text-muted transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 gap-2 border-t border-border/50 p-3 sm:grid-cols-2">
                    {group.items.map((feature) => {
                      const Icon = feature.icon;
                      const isSelected = selectedSet.has(feature.value);
                      return (
                        <label
                          key={feature.value}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-2.5 transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border bg-background hover:border-muted/30"
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleFeature(feature.value)}
                          />
                          <Icon
                            className={`h-4 w-4 shrink-0 ${
                              isSelected ? "text-primary" : "text-muted"
                            }`}
                          />
                          <span className="truncate text-sm font-medium text-foreground">
                            {feature.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
