"use client";

import { Field } from "@/components/ui/Field";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LuMapPin } from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import { NIGERIAN_STATES } from "@/utils/constants";

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
        <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <LuMapPin className="h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">Map pin (optional)</p>
          <p className="text-xs opacity-70">
            Connect a map provider to let sellers pin exact coordinates
          </p>
        </div>
      </section>
    </div>
  );
}
