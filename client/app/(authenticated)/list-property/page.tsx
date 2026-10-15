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
import type { ListPropertyStep } from "./hooks/useListPropertyForm";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";
import { LuX } from "react-icons/lu";
import {
  LuSparkles,
  LuHouse,
  LuMapPinned,
  LuFileCheck,
  LuSave,
  LuRocket,
} from "react-icons/lu";
import { useFormScrollOnError } from "@/hooks/useFormScrollOnError";

const LIST_PROPERTY_TOUR_STEPS = [
  {
    icon: LuSparkles,
    title: "Welcome — let's list your property",
    description:
      "This takes about 5 minutes across five short steps: Basic Info, Details & Price, Location, Photos & Documents, and a final Review. You can jump back to any completed step at any time using the progress bar above.",
  },
  {
    icon: LuHouse,
    title: "Start with the basics",
    description:
      'Tell us whether it\'s for sale or rent, pick a category and type, and write a clear title and description. A specific, descriptive title (e.g. "3-Bedroom Duplex in Lekki Phase 1") gets more views than a vague one.',
  },
  {
    icon: LuMapPinned,
    title: "Drop a pin on the map",
    description:
      "Along with your address, you can drag a pin to the exact spot on the map. This is optional, but listings with a precise location get more serious inquiries — buyers like knowing exactly where they're looking.",
  },
  {
    icon: LuFileCheck,
    title: "Documents? Just tell us what you have",
    description:
      "No uploading required at this stage — just select which ownership documents exist for the property (e.g. Certificate of Occupancy, Deed of Assignment). Our verification team will reach out separately to collect copies and complete the review.",
  },
  {
    icon: LuSave,
    title: "Nothing gets lost",
    description:
      "Your progress saves automatically as you go. If you close the tab or come back later, you'll be offered the chance to continue right where you left off — no retyping needed.",
  },
  {
    icon: LuRocket,
    title: "You're ready to publish",
    description:
      "Submitting takes your listing live immediately — it doesn't need to wait for document verification. A verified badge is added later, once your documents are reviewed. Good luck with the listing!",
  },
];

export default function ListPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const { bannerHeight } = useBannerHeightContext();
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
  } = useListPropertyForm();

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
    try {
      const payload = new FormData();

      payload.append("title", formData.title);
      payload.append("description", formData.description);
      payload.append("listingPurpose", formData.listingPurpose);
      payload.append("category", formData.category);
      payload.append("type", formData.type);
      payload.append("ownerType", formData.ownerType);
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
          `imageSection[${i}]`,
          formData.imageSections[i] ?? "general",
        );
      });

      const filteredVideos = formData.videoLinks.filter(Boolean);
      payload.append("videoLinks", JSON.stringify(filteredVideos));

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

      resetForm();
      router.push("/dashboard");
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

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
            <div className="h-6 w-40 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-4 w-56 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-muted animate-pulse" />
              <div className="h-24 w-full rounded bg-muted animate-pulse" />
              <div className="h-24 w-full rounded bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
        {draftAvailable && !draftDismissed && (
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <div className="flex justify-between gap-4 flex-wrap flex-1">
              <p className="text-sm text-foreground">
                You have an unfinished listing. Continue where you left off?
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={discardDraft}
                  className="text-xs font-medium text-muted hover:text-foreground transition-colors"
                >
                  Start fresh
                </button>
                <button
                  type="button"
                  onClick={keepDraft}
                  className="text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
                >
                  Continue draft
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={keepDraft}
              aria-label="Dismiss"
              className="text-muted hover:text-foreground transition-colors"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        )}

        <PropertyStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleEditStep}
        />

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
              <StepMedia formData={formData} updateField={updateField} />
            )}
            {currentStep === "review" && (
              <StepReview
                formData={formData}
                onEdit={handleEditStep}
                isSubmitting={isSubmitting}
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
    </div>
  );
}
