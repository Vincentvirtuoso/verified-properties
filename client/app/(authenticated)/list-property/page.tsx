"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyStepper } from "./components/PropertyStepper";
import { StepBasicInfo } from "./components/StepBasicInfo";
import { StepDetails } from "./components/StepDetails";
import { StepLocation } from "./components/StepLocation";
import { StepMedia } from "./components/StepMedia";
import { StepReview } from "./components/StepReview";
import { StepNav } from "./components/StepNav";
import { FeatureTour } from "@/components/common/FeatureTour";
import { useListPropertyForm, STEPS } from "./hooks/useListPropertyForm";
import type {
  ListPropertyFormData,
  ListPropertyStep,
} from "./hooks/useListPropertyForm";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import {
  LuSparkles,
  LuHouse,
  LuMapPinned,
  LuFileCheck,
  LuSave,
  LuRocket,
  LuArrowRight,
  LuTrash2,
} from "react-icons/lu";
import { useFormScrollOnError } from "@/hooks/useFormScrollOnError";
import ListingJsonImport, {
  type ListingFormPatch,
} from "@affilhomes/shared/ui/ListingJsonImport";
import {
  ListingPurpose,
  PROPERTY_DOCUMENT_TYPES,
  PROPERTY_MEDIA_SECTIONS,
} from "@/types";
import { Button } from "@affilhomes/shared/ui";
import { Modal } from "@/components/ui";

const LIST_PROPERTY_TOUR_STEPS = [
  {
    icon: LuSparkles,
    title: "Welcome, let's list your property",
    description:
      "This takes about 5 minutes across five steps: Basic Info, Details & Price, Location, Photos & Documents, and Review. Your progress is saved as you go, so you can stop at any point and come back to it.",
  },
  {
    icon: LuHouse,
    title: "Start with the basics",
    description:
      'Tell us whether the property is for sale or rent, then pick a category and type. Write a clear title, such as "3-Bedroom Duplex in Lekki Phase 1". Specific titles get more views than vague ones.',
  },
  {
    icon: LuMapPinned,
    title: "Pin the exact location",
    description:
      "Move the map until the crosshair sits on the building's entrance, then tap Drop pin here. The pin is required. You choose whether buyers see it publicly or only after they send an enquiry.",
  },
  {
    icon: LuSave,
    title: "Your draft is saved on this device",
    description:
      "Your text and photos are saved in this browser as you work. When you come back, you'll see a summary of your draft with the option to continue. Drafts stay on this device and browser only, so they won't appear on another phone or computer.",
  },
  {
    icon: LuFileCheck,
    title: "Photos and documents",
    description:
      "Add at least one photo. The first photo becomes the cover, and you can change it at any time. If your browser clears saved photos, we'll tell you which ones to add again. For documents, you only select which ones you have. You don't need to upload them now. Our verification team will contact you to collect copies.",
  },
  {
    icon: LuTrash2,
    title: "Continue or start fresh",
    description:
      "On your return, choose Continue draft to pick up where you left off, or Start fresh to delete the draft. Deleting a draft can't be undone.",
  },
  {
    icon: LuRocket,
    title: "Submit your listing",
    description:
      "When you submit, your listing is saved to your account. Declared documents are reviewed separately, and a verified badge is added once they've been checked.",
  },
];

const CONTENT_KEYS = [
  "title",
  "listingPurpose",
  "category",
  "type",
  "description",
  "price",
  "bedrooms",
  "bathrooms",
  "area",
  "features",
  "address",
  "city",
  "state",
  "coordinates",
  "imageFiles",
  "documentTypes",
] as const satisfies readonly (keyof ListPropertyFormData)[];

function DraftResolutionView({
  formData,
  bannerHeight,
  onContinue,
  onStartFresh,
}: {
  formData: ListPropertyFormData;
  bannerHeight: number;
  onContinue: () => void;
  onStartFresh: () => void;
}) {
  const previewLines = [
    formData.title && { label: "Title", value: formData.title },
    formData.category && {
      label: "Category",
      value: formData.category.replace(/([A-Z])/g, " $1").trim(),
    },
    formData.type && {
      label: "Type",
      value: formData.type.replace(/([A-Z])/g, " $1").trim(),
    },
    formData.address && { label: "Address", value: formData.address },
    formData.price && {
      label: "Price",
      value: `${formData.currency} ${formData.price}`,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20"
        style={{ top: bannerHeight + 64 }}
      >
        <div className="px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">List a Property</h1>
          <p className="text-sm text-muted">Resolve your draft to continue</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-10">
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <LuSave className="h-6 w-6 text-primary" />
            </div>
          </div>

          <h2 className="mt-4 text-center text-lg font-semibold text-foreground">
            You have an unfinished listing
          </h2>
          <p className="mt-2 text-center text-sm text-muted">
            We found a draft you started earlier. Pick how you'd like to proceed
            before continuing.
          </p>

          {previewLines.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                Draft summary
              </p>
              <dl className="space-y-2 text-sm">
                {previewLines.map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-start justify-between gap-4"
                  >
                    <dt className="shrink-0 text-muted">{label}</dt>
                    <dd className="truncate text-right font-medium text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <button
              type="button"
              onClick={onContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Continue draft
              <LuArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onStartFresh}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LuTrash2 className="h-4 w-4" />
              Start fresh
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">
            Starting fresh permanently deletes your saved draft.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ListPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { bannerHeight } = useBannerHeightContext();
  const isFirstRender = useRef(true);
  const stepContentRef = useRef<HTMLDivElement | null>(null);

  const {
    currentStep,
    stepIndex,
    formData,
    errors,
    updateField,
    goToStep,
    goPrev,
    handleNext,
    validateStep,
    resetForm,
    draftAvailable,
    draftDismissed,
    discardDraft,
    completedSteps,
    markCompleted,
    keepDraft,
    missingPhotoCount,
    photoSaveFailed,
  } = useListPropertyForm();

  const applyImportedPatch = (patch: ListingFormPatch) => {
    const b = patch.basic;
    updateField("title", b.title);
    if (b.listingPurpose) updateField("listingPurpose", b.listingPurpose);
    if (b.category) updateField("category", b.category);
    if (b.type) updateField("type", b.type);
    if (b.price != null) updateField("price", String(b.price));
    if (b.currency) updateField("currency", b.currency);
    if (b.negotiable != null) updateField("negotiable", b.negotiable);
    if (b.description) updateField("description", b.description);

    const d = patch.details;
    if (d.bedrooms != null) updateField("bedrooms", String(d.bedrooms));
    if (d.bathrooms != null) updateField("bathrooms", String(d.bathrooms));
    if (d.area != null) updateField("area", String(d.area));
    updateField("features", d.features);

    const l = patch.location;
    if (l.address) updateField("address", l.address);
    if (l.city) updateField("city", l.city);
    if (l.state) updateField("state", l.state);
    if (l.country) updateField("country", l.country);
    if (l.lat != null && l.lng != null) {
      updateField("coordinates", { lat: l.lat, lng: l.lng });
    }
    if (l.pinVisibility) updateField("locationVisibility", l.pinVisibility);

    updateField("documentTypes", patch.documents);
    updateField(
      "imageFiles",
      patch.photos.map((p) => p.file),
    );
    updateField(
      "imageSections",
      patch.photos.map((p) => p.section ?? "general"),
    );
  };

  function hasListingContent(d: ListPropertyFormData): boolean {
    return CONTENT_KEYS.some((key) => {
      const v = d[key];
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "string") return v.trim() !== "";
      return v != null;
    });
  }

  const handleImportApplied = (patch: ListingFormPatch) => {
    applyImportedPatch(patch);
    setImportOpen(false);
  };

  const scrollToFirstError = useFormScrollOnError();

  const handleContinue = () => {
    if (currentStep === "review") {
      handleSubmit();
      return;
    }

    const valid = validateStep(currentStep);

    if (!valid) {
      scrollToFirstError(stepContentRef.current);
      return;
    }

    markCompleted(currentStep);
    handleNext();
  };

  const handleBack = () => {
    goPrev();
  };

  const handleEditStep = (step: ListPropertyStep) => {
    goToStep(step);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const invalidStep = (
      ["basic", "details", "location", "media"] as const
    ).find((step) => !validateStep(step));
    if (invalidStep) {
      goToStep(invalidStep);
      return setIsSubmitting(false);
    }

    try {
      const payload = new FormData();

      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("listingPurpose", formData.listingPurpose);
      payload.append("category", formData.category);
      payload.append("type", formData.type);
      payload.append("price", formData.price);
      payload.append("currency", formData.currency);
      payload.append("negotiable", String(formData.negotiable));
      payload.append("bedrooms", formData.bedrooms);
      payload.append("bathrooms", formData.bathrooms);
      if (formData.area) payload.append("area", formData.area);
      payload.append("features", JSON.stringify(formData.features));

      payload.append("address", formData.address);
      payload.append("city", formData.city);
      payload.append("state", formData.state);
      payload.append("country", formData.country);
      if (formData.coordinates) {
        payload.append("latitude", String(formData.coordinates.lat));
        payload.append("longitude", String(formData.coordinates.lng));
      }
      payload.append("locationVisibility", formData.locationVisibility);

      formData.imageFiles.forEach((file, i) => {
        payload.append("images", file);
        payload.append(
          `imageSection_${i}`,
          formData.imageSections[i] ?? "general",
        );
      });

      payload.append("documentTypes", JSON.stringify(formData.documentTypes));

      const res = await fetch("/api/properties", {
        method: "POST",
        body: payload,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error ?? "Failed to submit listing");
      }

      router.push("/my-listings");
      resetForm();
    } catch (err) {
      console.error(err);
      window.alert(
        err instanceof Error ? err.message : "Failed to submit listing",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitle: Record<ListPropertyStep, string> = {
    basic: "Tell us about your property",
    details: "Pricing & specs",
    location: "Where is it located?",
    media: "Add photos & documents",
    review: "Review your listing",
  };

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const el = stepContentRef.current;
    if (!el) return;

    const headerOffset = bannerHeight + 64 + 120;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }, [currentStep, bannerHeight]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="h-6 w-40 rounded bg-muted/30 animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-muted/30 animate-pulse" />
          </div>
        </div>
        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-muted/30 animate-pulse" />
              <div className="h-24 w-full rounded bg-muted/30 animate-pulse" />
              <div className="h-24 w-full rounded bg-muted/30 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (draftAvailable && !draftDismissed) {
    return (
      <>
        <DraftResolutionView
          formData={formData}
          bannerHeight={bannerHeight}
          onContinue={keepDraft}
          onStartFresh={discardDraft}
        />
        <FeatureTour tourId="list-property" steps={LIST_PROPERTY_TOUR_STEPS} />
      </>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20"
        style={{ top: bannerHeight + 64 }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">List a Property</h1>
          <p className="text-sm text-muted">
            Step {stepIndex + 1} of {STEPS.length} — {stepTitle[currentStep]}
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-8 space-y-8">
        <PropertyStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleEditStep}
        />
        {currentStep === "basic" && (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Already have your listing details?
              </p>
              <p className="text-sm text-muted">
                Import them from a JSON file to fill the form in one step.
              </p>
            </div>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import from JSON
            </Button>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          <div ref={stepContentRef}>
            {currentStep === "basic" && (
              <StepBasicInfo
                formData={formData}
                errors={errors}
                updateField={updateField}
              />
            )}
            {currentStep === "details" && (
              <StepDetails
                formData={formData}
                errors={errors}
                updateField={updateField}
              />
            )}
            {currentStep === "location" && (
              <StepLocation
                formData={formData}
                errors={errors}
                updateField={updateField}
              />
            )}
            {currentStep === "media" && (
              <StepMedia
                formData={formData}
                updateField={updateField}
                errors={errors}
                photoSaveFailed={photoSaveFailed}
                missingPhotoCount={missingPhotoCount}
              />
            )}
            {currentStep === "review" && (
              <StepReview
                formData={formData}
                onEdit={handleEditStep}
                isSubmitting={isSubmitting}
                photoSaveFailed={photoSaveFailed}
                missingPhotoCount={missingPhotoCount}
              />
            )}
          </div>

          <StepNav
            currentStep={currentStep}
            onBack={handleBack}
            onNext={handleContinue}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <FeatureTour tourId="list-property" steps={LIST_PROPERTY_TOUR_STEPS} />
      {importOpen && (
        <Modal open={importOpen} onClose={() => setImportOpen(false)}>
          <ListingJsonImport
            documentTypes={PROPERTY_DOCUMENT_TYPES}
            sectionOptions={PROPERTY_MEDIA_SECTIONS}
            hasExistingInput={hasListingContent(formData)}
            onApply={handleImportApplied}
            onClose={() => setImportOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
