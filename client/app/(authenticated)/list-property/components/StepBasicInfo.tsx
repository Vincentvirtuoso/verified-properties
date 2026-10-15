"use client";

import { Field } from "@affilhomes/shared/ui/Field";
import { RadioGroup } from "@affilhomes/shared/ui/RadioGroup";
import { Textarea } from "@affilhomes/shared/ui/Textarea";
import { SectionHeader } from "@affilhomes/shared/ui/SectionHeader";
import {
  LuBuilding2,
  LuHouse,
  LuShoppingBag,
  LuTrendingUp,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import {
  type PropertyCategory,
  type PropertyType,
  type ListingPurpose,
} from "@affilhomes/shared/types";
import Select from "@affilhomes/shared/ui/Select";
import { PROPERTY_CATEGORY_LABELS, PROPERTY_TYPE_LABELS } from "@/utils";

const PURPOSE_OPTIONS = [
  {
    value: "sale",
    label: "For Sale",
    description: "List this property for outright purchase",
    icon: <LuShoppingBag className="h-5 w-5" />,
  },
  {
    value: "rent",
    label: "For Rent",
    description: "List this property for tenancy or lease",
    icon: <LuHouse className="h-5 w-5" />,
  },
] satisfies {
  value: ListingPurpose;
  label: string;
  description: string;
  icon: React.ReactNode;
}[];

export const CATEGORY_OPTIONS: { value: PropertyCategory; label: string }[] = (
  Object.keys(PROPERTY_CATEGORY_LABELS) as PropertyCategory[]
).map((value) => ({
  value,
  label: PROPERTY_CATEGORY_LABELS[value],
}));

const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
  residential: [
    "singleFamilyHouse",
    "detachedHouse",
    "semiDetachedHouse",
    "terraceHouse",
    "bungalow",
    "mansion",
    "apartment",
    "selfContainedApartment",
    "servicedApartment",
    "guestRoom",
    "guestHouse",
    "studentHostel",
    "duplex",
    "detachedDuplex",
    "semiDetachedDuplex",
    "terraceDuplex",
    "duplexWithBQ",
    "duplexWithPenthouse",
    "duplexVilla",
    "duplexMaisonette",
    "gardenDuplex",
    "smartDuplex",
    "maisonette",
    "penthouse",
  ],
  commercial: ["officeSpace", "retailShop", "warehouse"],
  industrial: ["factory", "industrialPark", "coldStorage"],
  agricultural: ["farm", "farmhouse"],
  land: [
    "residentialLand",
    "commercialLand",
    "agriculturalLand",
    "mixedUseLand",
  ],
  mixedUse: ["mixedUseDevelopment"],
  hospitality: ["hotel", "resortAndEventCenter"],
  institutional: ["schoolOrHospital"],
};

export const TYPES_BY_CATEGORY: Record<
  PropertyCategory,
  { value: PropertyType; label: string }[]
> = Object.fromEntries(
  (Object.keys(PROPERTY_TYPES_BY_CATEGORY) as PropertyCategory[]).map(
    (category) => [
      category,
      PROPERTY_TYPES_BY_CATEGORY[category].map((value) => ({
        value,
        label: PROPERTY_TYPE_LABELS[value],
      })),
    ],
  ),
) as Record<PropertyCategory, { value: PropertyType; label: string }[]>;

interface StepBasicInfoProps {
  formData: ListPropertyFormData;
  errors: Partial<Record<keyof ListPropertyFormData, string>>;
  updateField: <K extends keyof ListPropertyFormData>(
    key: K,
    value: ListPropertyFormData[K],
  ) => void;
}

export function StepBasicInfo({
  formData,
  errors,
  updateField,
}: StepBasicInfoProps) {
  const availableTypes = formData.category
    ? (TYPES_BY_CATEGORY[formData.category as PropertyCategory] ?? [])
    : [];

  const handleCategoryChange = (value: string) => {
    updateField("category", value as PropertyCategory);
  };

  console.log(formData);

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader
          icon={LuTrendingUp}
          title="Listing Purpose"
          description="How do you want to list this property?"
        />
        <RadioGroup
          name="listingPurpose"
          options={PURPOSE_OPTIONS}
          value={formData.listingPurpose}
          onChange={(v) => updateField("listingPurpose", v as ListingPurpose)}
          error={errors.listingPurpose}
        />
      </section>

      <section>
        <SectionHeader
          icon={LuHouse}
          title="Property Info"
          description="Provide a clear, descriptive title for your listing"
        />
        <div className="space-y-4">
          <Field
            label="Listing Title"
            name="title"
            placeholder="e.g. Spacious 3-Bedroom Duplex in Lekki Phase 1"
            value={formData.title}
            onChange={(e) => updateField("title", e.target.value)}
            required
            error={errors.title}
          />

          <Textarea
            label="Description"
            name="description"
            placeholder="Describe the property — key features, surroundings, access roads, security, etc."
            value={formData.description}
            onChange={(v) => updateField("description", v)}
            maxLength={2000}
            rows={4}
          />
        </div>
      </section>

      <section>
        <SectionHeader
          icon={LuBuilding2}
          title="Category & Type"
          description="Select the category that best fits your property"
        />
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category <span className="text-destructive ml-0.5">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const isSelected = formData.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted hover:border-muted-foreground/40"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-destructive text-xs mt-1.5">
                {errors.category}
              </p>
            )}
          </div>

          {formData.category && availableTypes.length > 0 && (
            <Select
              options={availableTypes}
              key={`${formData.category}-${formData.type ? "has-type" : "empty"}`}
              label="Property Type"
              error={errors.type}
              value={formData.type}
              onChange={(value) => updateField("type", value as PropertyType)}
              required
            />
          )}
        </div>
      </section>
    </div>
  );
}
