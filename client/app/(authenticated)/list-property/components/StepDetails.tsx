"use client";

import { Field } from "@/components/ui/Field";
import { Checkbox } from "@/components/ui/Checkbox";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LuBanknote, LuLayoutGrid, LuStar } from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import type { PropertyFeature } from "@/types";

const FEATURES: { value: PropertyFeature; label: string; emoji: string }[] = [
  { value: "boysQuarters", label: "Boys Quarters (BQ)", emoji: "🏠" },
  { value: "penthouse", label: "Penthouse", emoji: "🏙️" },
  { value: "garden", label: "Garden", emoji: "🌿" },
  { value: "smartHome", label: "Smart Home", emoji: "📱" },
  { value: "furnished", label: "Furnished", emoji: "🛋️" },
  { value: "serviced", label: "Serviced", emoji: "⚡" },
];

const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

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
  const toggleFeature = (feature: PropertyFeature) => {
    const current = formData.features;
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    updateField("features", next);
  };

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuBanknote}
          title="Pricing"
          description="Set your asking price and currency"
        />
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="shrink-0">
              <label className="block text-sm font-medium text-foreground mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => updateField("currency", e.target.value)}
                className="h-11.5 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <Field
                label="Price"
                name="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => updateField("price", e.target.value)}
                required
                error={errors.price}
              />
            </div>
          </div>

          <Checkbox
            id="negotiable"
            label="Price is negotiable"
            checked={formData.negotiable}
            onChange={(e) => updateField("negotiable", e.target.checked)}
          />
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
          />
          <Field
            label="Bathrooms"
            name="bathrooms"
            type="number"
            placeholder="0"
            value={formData.bathrooms}
            onChange={(e) => updateField("bathrooms", e.target.value)}
            required
            error={errors.bathrooms}
          />
          <Field
            label="Area (sqm)"
            name="area"
            type="number"
            placeholder="Optional"
            value={formData.area}
            onChange={(e) => updateField("area", e.target.value)}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuStar}
          title="Features & Amenities"
          description="Select all features that apply to this property"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <label
              key={feature.value}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                formData.features.includes(feature.value)
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/30"
              }`}
            >
              <Checkbox
                checked={formData.features.includes(feature.value)}
                onChange={() => toggleFeature(feature.value)}
              />
              <span className="text-lg" aria-hidden="true">
                {feature.emoji}
              </span>
              <span className="text-sm font-medium text-foreground">
                {feature.label}
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
