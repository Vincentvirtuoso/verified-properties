"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { Field } from "@affilhomes/shared/ui/Field";
import { SectionHeader } from "@affilhomes/shared/ui/SectionHeader";
import { RadioGroup } from "@affilhomes/shared/ui/RadioGroup";
import { LuMapPin } from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import { NIGERIAN_STATES } from "@/utils";
import { getRegionCenter } from "@/utils/nigeria-state-centers";
import Select from "@affilhomes/shared/ui/Select";

const LocationPicker = dynamic(
  () =>
    import("../../../../components/common/LocationPicker").then(
      (m) => m.LocationPicker,
    ),
  {
    ssr: false,
    loading: () => <LocationPickerSkeleton />,
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

export function StepLocation({
  formData,
  errors,
  updateField,
}: StepLocationProps) {
  const handlePin = useCallback(
    (lat: number, lng: number) => updateField("coordinates", { lat, lng }),
    [updateField],
  );
  const region = getRegionCenter(formData.state, formData.country);

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
            <Select
              id="state"
              label="State"
              required
              error={errors.state}
              name="state"
              value={formData.state}
              onChange={(value) => updateField("state", value)}
              options={NIGERIAN_STATES.map((state) => ({
                label: state,
                value: state,
              }))}
            />
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
          <span className="block text-sm font-medium text-foreground">
            Exact location on map <span className="text-destructive">*</span>
          </span>
          {formData.coordinates && (
            <span className="text-xs text-muted">
              {formData.coordinates.lat.toFixed(5)},{" "}
              {formData.coordinates.lng.toFixed(5)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted mb-3">
          Move the map until the crosshair is on the building entrance, then tap
          &ldquo;Drop pin here&rdquo;. Buyers rely on this location, so please
          be precise.
        </p>
        <div className="rounded-xl overflow-hidden border border-border">
          <LocationPicker
            lat={formData.coordinates?.lat ?? null}
            lng={formData.coordinates?.lng ?? null}
            regionLat={region?.[0] ?? null}
            regionLng={region?.[1] ?? null}
            onPick={handlePin}
          />
        </div>
        {errors.coordinates && (
          <p className="text-destructive text-xs mt-1.5">
            {errors.coordinates}
          </p>
        )}

        <RadioGroup
          name="locationVisibility"
          value={formData.locationVisibility}
          onChange={(v) =>
            updateField("locationVisibility", v as "public" | "private")
          }
          options={[
            {
              value: "private",
              label: "Private",
              description: "Only people who send an enquiry see the exact pin",
            },
            {
              value: "public",
              label: "Public",
              description: "Anyone viewing the listing sees the exact pin",
            },
          ]}
          className="mt-6"
        />
      </section>
    </div>
  );
}

function LocationPickerSkeleton() {
  return (
    <div className="relative w-full h-100 bg-muted animate-pulse rounded-xl overflow-hidden">
      <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[32px_32px]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-6 h-6 rounded-full border-2 border-border bg-background/60" />
      </div>

      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <div className="w-8 h-8 rounded-md bg-background/70 border border-border" />
        <div className="w-8 h-8 rounded-md bg-background/70 border border-border" />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 h-9 w-40 rounded-full bg-background/70 border border-border" />

      <span className="sr-only">Loading map…</span>
    </div>
  );
}
