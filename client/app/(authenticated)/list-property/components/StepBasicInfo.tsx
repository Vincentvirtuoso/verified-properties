"use client";

import { Field } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Textarea } from "@/components/ui/Textarea";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  LuBuilding2,
  LuHouse,
  LuShoppingBag,
  LuTrendingUp,
} from "react-icons/lu";
import type { ListPropertyFormData } from "../hooks/useListPropertyForm";
import type { PropertyCategory, PropertyType, ListingPurpose } from "@/types";
import Select from "@/components/ui/Select";

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

const CATEGORY_OPTIONS: { value: PropertyCategory; label: string }[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "land", label: "Land" },
  { value: "mixedUse", label: "Mixed Use" },
  { value: "hospitality", label: "Hospitality" },
  { value: "institutional", label: "Institutional" },
];

const TYPES_BY_CATEGORY: Record<
  PropertyCategory,
  { value: PropertyType; label: string }[]
> = {
  residential: [
    { value: "singleFamilyHouse", label: "Single Family House" },
    { value: "apartment", label: "Apartment" },
    { value: "terrace", label: "Terrace" },
    { value: "detachedDuplex", label: "Detached Duplex" },
    { value: "semiDetachedDuplex", label: "Semi-Detached Duplex" },
    { value: "terraceDuplex", label: "Terrace Duplex" },
    { value: "duplexWithBQ", label: "Duplex with BQ" },
    { value: "duplexWithPenthouse", label: "Duplex with Penthouse" },
    { value: "duplexVilla", label: "Duplex Villa" },
    { value: "duplexMaisonette", label: "Duplex Maisonette" },
    { value: "gardenDuplex", label: "Garden Duplex" },
    { value: "smartDuplex", label: "Smart Duplex" },
    { value: "studentHostel", label: "Student Hostel" },
    { value: "servicedApartment", label: "Serviced Apartment" },
  ],
  commercial: [
    { value: "officeSpace", label: "Office Space" },
    { value: "retailShop", label: "Retail Shop" },
    { value: "warehouse", label: "Warehouse" },
  ],
  industrial: [
    { value: "factory", label: "Factory" },
    { value: "industrialPark", label: "Industrial Park" },
    { value: "coldStorage", label: "Cold Storage" },
  ],
  land: [
    { value: "residentialLand", label: "Residential Land" },
    { value: "commercialLand", label: "Commercial Land" },
    { value: "agriculturalLand", label: "Agricultural Land" },
    { value: "mixedUseLand", label: "Mixed Use Land" },
  ],
  mixedUse: [{ value: "mixedUseDevelopment", label: "Mixed Use Development" }],
  hospitality: [
    { value: "hotel", label: "Hotel" },
    { value: "resortAndEventCenter", label: "Resort & Event Center" },
  ],
  institutional: [{ value: "schoolOrHospital", label: "School / Hospital" }],
};

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
                        : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40"
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
