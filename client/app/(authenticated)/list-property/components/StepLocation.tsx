"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Field } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LuMapPin } from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import { NIGERIAN_STATES } from "@/utils/constants";
import { PageSpinner } from "@/components/ui/Spinner";

const LocationPicker = dynamic(
  () =>
    import("../../../../components/common/LocationPicker").then(
      (m) => m.LocationPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <PageSpinner
        label="Loading map…"
      />
    ),
  },
);

interface StepLocationProps {
  formData: ListPropertyFormData;
  errors: Partial<Record<keyof ListPropertyFormData, string>>;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
}

// Nigeria's rough centre — used as the map's starting view when no
// pin has been placed yet.
const DEFAULT_CENTER: [number, number] = [9.082, 8.6753];

export function StepLocation({
  formData,
  errors,
  updateField,
}: StepLocationProps) {
  const [mapTouched, setMapTouched] = useState(Boolean(formData.coordinates));

  const handlePin = useCallback(
    (lat: number, lng: number) => {
      updateField("coordinates", { lat, lng });
      setMapTouched(true);
    },
    [updateField],
  );

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuMapPin}
          title="Property Location"
          description="Provide the full address so buyers or tenants can find it"
        />

        <div className="space-y-4">
          <Field
            label="Street Address"
            name="address"
            placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
            value={formData.address}
            onChange={(e) => updateField("address", e.target.value)}
            required
            error={errors.address}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="City / Area"
              name="city"
              placeholder="e.g. Lekki"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              required
              error={errors.city}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                State <span className="text-destructive ml-0.5">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => updateField("state", e.target.value)}
                className={`w-full rounded-lg border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all ${
                  errors.state ? "border-destructive" : "border-border"
                }`}
              >
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-destructive text-xs mt-1">{errors.state}</p>
              )}
            </div>
          </div>

          <Field
            label="Country"
            name="country"
            value={formData.country}
            onChange={(e) => updateField("country", e.target.value)}
            required
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-foreground">
            Pin on Map{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </label>
          {mapTouched && formData.coordinates && (
            <span className="text-xs text-muted-foreground">
              {formData.coordinates.lat.toFixed(5)},{" "}
              {formData.coordinates.lng.toFixed(5)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Drag the pin to the exact spot. This helps buyers find the property
          and isn&apos;t required to publish your listing.
        </p>
        <div className="rounded-xl overflow-hidden border border-border">
          <LocationPicker
            center={
              formData.coordinates
                ? [formData.coordinates.lat, formData.coordinates.lng]
                : DEFAULT_CENTER
            }
            hasPin={Boolean(formData.coordinates)}
            onPick={handlePin}
          />
        </div>
      </section>
    </div>
  );
}
