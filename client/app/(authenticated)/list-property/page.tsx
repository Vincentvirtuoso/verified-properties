"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  LuBuilding,
  LuDollarSign,
  LuMapPin,
  LuFileText,
  LuPlus,
  LuTrash2,
  LuBed,
  LuBath,
  LuMaximize,
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuImage,
  LuVideo,
  LuPercent,
  LuMap,
  LuInfo,
  LuEye,
  LuSave,
} from "react-icons/lu";

import { Breadcrumbs, BreadcrumbItem } from "@/components/common/BreadCrumbs";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Field } from "@/components/ui/Field";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { Button } from "@/components/ui/Button";

import {
  Property,
  PropertyCategory,
  PropertyType,
  PropertyFeature,
  PropertyOwnerType,
  ListingPurpose,
  ListingTier,
  PropertyDocumentType,
  PropertyImage,
  PropertyDocument,
} from "@/types/property";

const TOTAL_STEPS = 5; // Added a review step

// Full list of property types organised by category (for dynamic filtering)
const PROPERTY_TYPES_BY_CATEGORY: Record<PropertyCategory, PropertyType[]> = {
  residential: [
    "singleFamilyHouse",
    "apartment",
    "terrace",
    "detachedDuplex",
    "semiDetachedDuplex",
    "terraceDuplex",
    "duplexWithBQ",
    "duplexWithPenthouse",
    "duplexVilla",
    "duplexMaisonette",
    "gardenDuplex",
    "smartDuplex",
    "studentHostel",
    "servicedApartment",
  ],
  commercial: ["officeSpace", "retailShop", "warehouse", "hotel"],
  industrial: ["factory", "industrialPark", "coldStorage"],
  land: [
    "residentialLand",
    "commercialLand",
    "agriculturalLand",
    "mixedUseLand",
  ],
  mixedUse: ["mixedUseDevelopment"],
  hospitality: ["resortAndEventCenter"],
  institutional: ["schoolOrHospital"],
};

// All possible features (human readable)
const ALL_FEATURES: { value: PropertyFeature; label: string }[] = [
  { value: "boysQuarters", label: "Boys' Quarters" },
  { value: "penthouse", label: "Penthouse" },
  { value: "garden", label: "Private Garden" },
  { value: "smartHome", label: "Smart Home Automation" },
  { value: "furnished", label: "Fully Furnished" },
  { value: "serviced", label: "Serviced" },
];

// All document types (human readable)
const DOCUMENT_TYPES: { value: PropertyDocumentType; label: string }[] = [
  {
    value: "certificateOfOccupancy",
    label: "Certificate of Occupancy (C of O)",
  },
  { value: "governorsConsent", label: "Governor's Consent" },
  { value: "deedOfAssignment", label: "Deed of Assignment" },
  { value: "deedOfSublease", label: "Deed of Sublease" },
  { value: "deedOfSurrender", label: "Deed of Surrender" },
  { value: "deedOfMortgage", label: "Deed of Mortgage" },
  { value: "deedOfGift", label: "Deed of Gift" },
  { value: "deedOfLease", label: "Deed of Lease" },
  { value: "deedOfConveyance", label: "Deed of Conveyance" },
  { value: "surveyPlan", label: "Registered Survey Plan" },
  { value: "approvedBuildingPlan", label: "Approved Building Plan" },
  { value: "excisionDocument", label: "Excision Document" },
  { value: "gazette", label: "Gazette" },
  { value: "letterOfAllocation", label: "Letter of Allocation" },
  { value: "receiptOfPaymentForLand", label: "Receipt of Payment for Land" },
  { value: "contractOfSale", label: "Contract of Sale" },
  { value: "powerOfAttorney", label: "Power of Attorney" },
  {
    value: "irrevocablePowerOfAttorney",
    label: "Irrevocable Power of Attorney",
  },
  { value: "affidavitOfLoss", label: "Affidavit of Loss" },
  {
    value: "probateLetterOfAdministration",
    label: "Probate / Letter of Administration",
  },
  { value: "landPurchaseAgreement", label: "Land Purchase Agreement" },
  { value: "taxClearanceCertificate", label: "Tax Clearance Certificate" },
  {
    value: "certificateOfStatutoryRightOfOccupancy",
    label: "Certificate of Statutory Right of Occupancy",
  },
  { value: "registeredSurveyPlan", label: "Registered Survey Plan" },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftSaved, setShowDraftSaved] = useState(false);

  // Form state (matching Property type, partial for creation)
  const [formData, setFormData] = useState<Partial<Property>>({
    title: "",
    description: "",
    category: "residential",
    type: "apartment",
    ownerType: "agent",
    tier: "standard",
    listingPurpose: "rent",
    status: "draft",
    price: 0,
    currency: "NGN",
    negotiable: false,
    bedrooms: 0,
    bathrooms: 0,
    area: 0,
    features: [],
    location: {
      address: "",
      city: "",
      state: "",
      country: "Nigeria",
      coordinates: { lat: 0, lng: 0 },
    },
    gallery: [],
    videoLinks: [],
    documents: [],
    discount: { amount: 0, percentage: 0 },
    totalInquiries: 0,
    totalClosedDeals: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Breadcrumbs
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Properties", href: "/dashboard/properties" },
    { label: "New Listing" },
  ];

  // Dynamic property types based on selected category
  const availablePropertyTypes = useMemo(() => {
    return (
      PROPERTY_TYPES_BY_CATEGORY[formData.category as PropertyCategory] || []
    );
  }, [formData.category]);

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNestedLocationChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location!,
        [name]: value,
      },
    }));
  };

  const handleCoordinatesChange = (axis: "lat" | "lng", value: string) => {
    const num = parseFloat(value) || 0;
    setFormData((prev) => {
      const coordinates = prev.location?.coordinates ?? { lat: 0, lng: 0 };
      return {
        ...prev,
        location: {
          ...prev.location!,
          coordinates: { ...coordinates, [axis]: num },
        },
      };
    });
  };

  const toggleFeature = (feature: PropertyFeature) => {
    setFormData((prev) => {
      const current = prev.features || [];
      const updated = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];
      return { ...prev, features: updated };
    });
  };

  // Gallery management
  const addGalleryImage = () => {
    const newImage: PropertyImage = { url: "", alt: "" };
    setFormData((prev) => ({
      ...prev,
      gallery: [...(prev.gallery || []), newImage],
    }));
  };

  const updateGalleryImage = (
    index: number,
    field: keyof PropertyImage,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...(prev.gallery || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, gallery: updated };
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery: (prev.gallery || []).filter((_, i) => i !== index),
    }));
  };

  // Video links management
  const addVideoLink = () => {
    setFormData((prev) => ({
      ...prev,
      videoLinks: [...(prev.videoLinks || []), ""],
    }));
  };

  const updateVideoLink = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.videoLinks || [])];
      updated[index] = value;
      return { ...prev, videoLinks: updated };
    });
  };

  const removeVideoLink = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      videoLinks: (prev.videoLinks || []).filter((_, i) => i !== index),
    }));
  };

  // Documents management
  const addDocument = () => {
    const newDoc: PropertyDocument = {
      type: "certificateOfOccupancy",
      fileUrl: "",
      title: "",
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }));
  };

  const updateDocument = (
    index: number,
    field: keyof PropertyDocument,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = [...(prev.documents || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, documents: updated };
    });
  };

  const removeDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((_, i) => i !== index),
    }));
  };

  // Discount handling
  const updateDiscount = (type: "amount" | "percentage", value: number) => {
    setFormData((prev) => ({
      ...prev,
      discount: { ...prev.discount, [type]: value },
    }));
  };

  // Validation per step
  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.category)
        newErrors.category = "Property category is required";
      if (!formData.type) newErrors.type = "Property type is required";
      if (!formData.listingPurpose)
        newErrors.listingPurpose = "Listing purpose is required";
      if (!formData.ownerType) newErrors.ownerType = "Owner type is required";
    }
    if (step === 2) {
      if (!formData.title?.trim())
        newErrors.title = "A descriptive title is required";
      if (!formData.price || formData.price <= 0)
        newErrors.price = "Valid price is required";
      if (!formData.currency) newErrors.currency = "Currency is required";
    }
    if (step === 3) {
      if (!formData.location?.address?.trim())
        newErrors.address = "Street address is required";
      if (!formData.location?.city?.trim()) newErrors.city = "City is required";
      if (!formData.location?.state?.trim())
        newErrors.state = "State/Region is required";
      if (formData.bedrooms === undefined || formData.bedrooms < 0)
        newErrors.bedrooms = "Valid bedroom count";
      if (formData.bathrooms === undefined || formData.bathrooms < 0)
        newErrors.bathrooms = "Valid bathroom count";
      if (formData.area !== undefined && formData.area < 0)
        newErrors.area = "Area cannot be negative";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      // API call to save as draft
      console.log("Saving draft:", formData);
      setShowDraftSaved(true);
      setTimeout(() => setShowDraftSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    setIsSubmitting(true);
    try {
      // Submit final listing
      console.log("Publishing property:", formData);
      router.push("/dashboard/properties");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format labels for property types
  const formatPropertyTypeLabel = (type: string) => {
    return type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/B Q/, "BQ");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} variant="default" size="sm" />

      <div className="bg-card rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="space-y-3">
          <ProgressBar
            value={step}
            max={TOTAL_STEPS}
            label={`Step ${step} of ${TOTAL_STEPS}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={step >= 1 ? "text-primary font-medium" : ""}>
              🏠 Category
            </span>
            <span className={step >= 2 ? "text-primary font-medium" : ""}>
              💰 Pricing
            </span>
            <span className={step >= 3 ? "text-primary font-medium" : ""}>
              📍 Details
            </span>
            <span className={step >= 4 ? "text-primary font-medium" : ""}>
              📎 Media & Docs
            </span>
            <span className={step >= 5 ? "text-primary font-medium" : ""}>
              ✅ Review
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SectionHeader
                icon={LuBuilding}
                title="Property Classification"
                description="Define the type, category, and purpose of your listing."
              />

              <RadioGroup
                label="Listing Purpose"
                name="listingPurpose"
                value={formData.listingPurpose || "rent"}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    listingPurpose: val as ListingPurpose,
                  }))
                }
                options={[
                  {
                    value: "rent",
                    label: "For Rent",
                    description: "Monthly or yearly lease",
                  },
                  {
                    value: "sale",
                    label: "For Sale",
                    description: "Outright purchase",
                  },
                ]}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    Category{" "}
                    <LuInfo className="w-3.5 h-3.5 text-muted-foreground" />
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value as PropertyCategory,
                        type:
                          PROPERTY_TYPES_BY_CATEGORY[
                            e.target.value as PropertyCategory
                          ]?.[0] || "",
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="land">Land / Plots</option>
                    <option value="mixedUse">Mixed‑Use</option>
                    <option value="hospitality">Hospitality</option>
                    <option value="institutional">Institutional</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">
                    Property Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        type: e.target.value as PropertyType,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    {availablePropertyTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatPropertyTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <p className="text-xs text-red-500 mt-1">{errors.type}</p>
                  )}
                </div>
              </div>

              <RadioGroup
                label="Owner / Representative Type"
                name="ownerType"
                value={formData.ownerType || "agent"}
                onChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    ownerType: val as PropertyOwnerType,
                  }))
                }
                options={[
                  {
                    value: "agent",
                    label: "Licensed Agent/Broker",
                    description: "Acting on behalf of owner",
                  },
                  {
                    value: "landlord",
                    label: "Direct Owner (Landlord)",
                    description: "Primary title holder",
                  },
                  {
                    value: "company",
                    label: "Corporate Entity",
                    description: "Company owned asset",
                  },
                ]}
              />

              <RadioGroup
                label="Listing Visibility Tier"
                name="tier"
                value={formData.tier || "standard"}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, tier: val as ListingTier }))
                }
                options={[
                  {
                    value: "standard",
                    label: "Standard",
                    description: "Regular placement in search results",
                  },
                  {
                    value: "featured",
                    label: "Featured (Premium)",
                    description: "Higher visibility, top of listings",
                  },
                ]}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SectionHeader
                icon={LuDollarSign}
                title="Pricing & Basic Info"
                description="Set the title, price, and financial details."
              />

              <Field
                label="Listing Title *"
                name="title"
                placeholder="e.g., Luxurious 4-Bedroom Duplex with Penthouse in Ikoyi"
                value={formData.title}
                onChange={handleInputChange}
                required
                error={errors.title}
                // helper="A clear, descriptive title attracts more buyers/tenants."
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Full Description
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Describe key features, nearby amenities, unique selling points, and any renovation details..."
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm resize-y focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Field
                    label="Price *"
                    name="price"
                    type="number"
                    placeholder="e.g., 250000000"
                    value={formData.price?.toString()}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    error={errors.price}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  >
                    <option value="NGN">₦ Nigerian Naira (NGN)</option>
                    <option value="USD">$ US Dollar (USD)</option>
                    <option value="GBP">£ British Pound (GBP)</option>
                    <option value="EUR">€ Euro (EUR)</option>
                  </select>
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.negotiable || false}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          negotiable: e.target.checked,
                        }))
                      }
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    Price is negotiable
                  </label>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <LuPercent className="w-4 h-4 text-muted-foreground" />
                  <h4 className="font-medium">Discount / Promo (optional)</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field
                    label="Fixed discount (amount)"
                    type="number"
                    placeholder="e.g., 5000000"
                    value={formData.discount?.amount?.toString() || ""}
                    onChange={(e) =>
                      updateDiscount("amount", parseFloat(e.target.value) || 0)
                    }
                    name="amount"
                  />
                  <Field
                    name="percentage"
                    label="Percentage discount (%)"
                    type="number"
                    placeholder="e.g., 10"
                    value={formData.discount?.percentage?.toString() || ""}
                    onChange={(e) =>
                      updateDiscount(
                        "percentage",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Final price will be calculated automatically on the listing.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SectionHeader
                icon={LuMapPin}
                title="Location & Property Details"
                description="Provide exact address, dimensions, and room counts."
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LuBed className="w-4 h-4" /> Bedrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bedrooms: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LuBath className="w-4 h-4" /> Bathrooms
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms || 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        bathrooms: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LuMaximize className="w-4 h-4" /> Area (sqm)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 250"
                    value={formData.area || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        area: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">
                  Key Features & Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ALL_FEATURES.map((feat) => {
                    const isChecked =
                      formData.features?.includes(feat.value) || false;
                    return (
                      <button
                        type="button"
                        key={feat.value}
                        onClick={() => toggleFeature(feat.value)}
                        className={`flex items-center gap-2 p-3 text-sm font-medium rounded-xl border transition-all ${
                          isChecked
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-background border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? "bg-primary border-primary"
                              : "border-border"
                          }`}
                        >
                          {isChecked && (
                            <LuCheck className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span>{feat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h4 className="font-semibold">📍 Full Address</h4>
                <Field
                  label="Street Address *"
                  name="address"
                  placeholder="House number, street, estate name"
                  value={formData.location?.address}
                  onChange={handleNestedLocationChange}
                  required
                  error={errors.address}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field
                    label="City *"
                    name="city"
                    placeholder="e.g., Lagos"
                    value={formData.location?.city}
                    onChange={handleNestedLocationChange}
                    required
                    error={errors.city}
                  />
                  <Field
                    label="State / Region *"
                    name="state"
                    placeholder="e.g., Lagos State"
                    value={formData.location?.state}
                    onChange={handleNestedLocationChange}
                    required
                    error={errors.state}
                  />
                  <Field
                    label="Country"
                    name="country"
                    placeholder="Nigeria"
                    value={formData.location?.country}
                    onChange={handleNestedLocationChange}
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <LuMap className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      GPS Coordinates (optional)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field
                      label="Latitude"
                      name="lat"
                      type="number"
                      placeholder="e.g., 6.5244"
                      value={formData.location?.coordinates?.lat || ""}
                      onChange={(e) =>
                        handleCoordinatesChange("lat", e.target.value)
                      }
                    />
                    <Field
                      label="Longitude"
                      name="lng"
                      type="number"
                      placeholder="e.g., 3.3792"
                      value={formData.location?.coordinates?.lng || ""}
                      onChange={(e) =>
                        handleCoordinatesChange("lng", e.target.value)
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Adding exact coordinates helps buyers find the property on a
                    map.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <SectionHeader
                icon={LuFileText}
                title="Media & Legal Documents"
                description="Upload images, videos, and official documents to build trust."
              />

              <Field
                label="Main Cover Image URL"
                name="image"
                placeholder="https://your-storage.com/cover-photo.jpg"
                value={formData.image || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, image: e.target.value }))
                }
                // helper="This will be the primary thumbnail on listing cards."
              />

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LuImage className="w-4 h-4" /> Gallery Images
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<LuPlus />}
                    onClick={addGalleryImage}
                  >
                    Add Image
                  </Button>
                </div>
                {(formData.gallery || []).length === 0 && (
                  <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-4 text-center">
                    No images added. Click &quot;Add Image&quot; to showcase the
                    property.
                  </p>
                )}
                <div className="space-y-3">
                  {(formData.gallery || []).map((img, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row gap-3 p-3 border rounded-xl bg-muted/10"
                    >
                      <input
                        type="text"
                        placeholder="Image URL"
                        value={img.url}
                        onChange={(e) =>
                          updateGalleryImage(idx, "url", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Alt text (optional)"
                        value={img.alt || ""}
                        onChange={(e) =>
                          updateGalleryImage(idx, "alt", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeGalleryImage(idx)}
                        leftIcon={<LuTrash2 />}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <LuVideo className="w-4 h-4" /> Video Tours (YouTube, Vimeo,
                    etc.)
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<LuPlus />}
                    onClick={addVideoLink}
                  >
                    Add Video
                  </Button>
                </div>
                {(formData.videoLinks || []).map((link, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      value={link}
                      onChange={(e) => updateVideoLink(idx, e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeVideoLink(idx)}
                    >
                      <LuTrash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    📄 Legal & Title Documents
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<LuPlus />}
                    onClick={addDocument}
                  >
                    Attach Document
                  </Button>
                </div>
                {(formData.documents || []).length === 0 && (
                  <p className="text-sm text-muted-foreground border border-dashed rounded-xl p-4 text-center">
                    No documents attached. Upload title deeds, C of O, survey
                    plans, etc.
                  </p>
                )}
                <div className="space-y-3">
                  {(formData.documents || []).map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap gap-3 p-3 border rounded-xl bg-muted/10 items-center"
                    >
                      <select
                        value={doc.type}
                        onChange={(e) =>
                          updateDocument(
                            idx,
                            "type",
                            e.target.value as PropertyDocumentType,
                          )
                        }
                        className="w-full sm:w-64 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      >
                        {DOCUMENT_TYPES.map((dt) => (
                          <option key={dt.value} value={dt.value}>
                            {dt.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Document title (optional)"
                        value={doc.title || ""}
                        onChange={(e) =>
                          updateDocument(idx, "title", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="url"
                        placeholder="File URL (PDF/Image link)"
                        value={doc.fileUrl}
                        onChange={(e) =>
                          updateDocument(idx, "fileUrl", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeDocument(idx)}
                      >
                        <LuTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <SectionHeader
                icon={LuEye}
                title="Review & Publish"
                description="Check all details before making your listing live."
              />

              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="font-medium">Title:</div>
                  <div>{formData.title || "—"}</div>

                  <div className="font-medium">Category / Type:</div>
                  <div className="capitalize">
                    {formData.category} / {formData.type}
                  </div>

                  <div className="font-medium">Purpose / Owner:</div>
                  <div>
                    {formData.listingPurpose} · {formData.ownerType}
                  </div>

                  <div className="font-medium">Price:</div>
                  <div>
                    {formData.currency} {formData.price?.toLocaleString()}
                    {formData.negotiable && " (Negotiable)"}
                    {formData.discount?.amount && (
                      <span className="text-green-600 ml-2">
                        Discount applied
                      </span>
                    )}
                  </div>

                  <div className="font-medium">Location:</div>
                  <div>
                    {formData.location?.address}, {formData.location?.city},{" "}
                    {formData.location?.state}
                  </div>

                  <div className="font-medium">Bed / Bath / Area:</div>
                  <div>
                    {formData.bedrooms} bed · {formData.bathrooms} bath ·{" "}
                    {formData.area || "?"} m²
                  </div>

                  <div className="font-medium">Features:</div>
                  <div>
                    {(formData.features || []).length > 0
                      ? formData.features?.join(", ")
                      : "None selected"}
                  </div>

                  <div className="font-medium">Media:</div>
                  <div>
                    {formData.image ? "✓ Cover image" : "✗ No cover"} |
                    {(formData.gallery || []).length} gallery image(s) |
                    {(formData.videoLinks || []).length} video(s)
                  </div>

                  <div className="font-medium">Documents:</div>
                  <div>
                    {(formData.documents || []).length} document(s) attached
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
                <p className="flex items-center gap-2">
                  <LuInfo className="w-4 h-4" />
                  By publishing, you confirm that all information provided is
                  accurate and you have the right to list this property.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || isSubmitting}
                leftIcon={<LuArrowLeft />}
              >
                Back
              </Button>
              {step < TOTAL_STEPS && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  rightIcon={<LuArrowRight />}
                >
                  Continue
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveDraft}
                isLoading={isSubmitting}
                leftIcon={<LuSave />}
              >
                Save as Draft
              </Button>
              {step === TOTAL_STEPS && (
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  rightIcon={<LuCheck />}
                >
                  Publish Listing
                </Button>
              )}
            </div>
          </div>

          {showDraftSaved && (
            <div className="fixed bottom-5 right-5 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-in slide-in-from-right">
              Draft saved successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
