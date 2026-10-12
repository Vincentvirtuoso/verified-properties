"use client";

import { useState } from "react";
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

const LIST_PROPERTY_TOUR_STEPS = [
  {
    title: "Welcome to the listing wizard",
    description:
      "We'll walk you through five short steps. Your progress is saved automatically, so you can leave and come back anytime.",
  },
  {
    title: "Documents? Just tell us what you have",
    description:
      "No need to upload anything now. Select which ownership documents exist for this property — our team will reach out separately to collect copies.",
  },
  {
    title: "Verification doesn't block you",
    description:
      "Your listing goes live right away without a verified badge. Declaring documents starts the verification process, it doesn't delay publishing.",
  },
];

export default function ListPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<ListPropertyStep[]>([]);
  const { bannerHeight } = useBannerHeightContext();

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
    keepDraft,
  } = useListPropertyForm();

  const markCompleted = (step: ListPropertyStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  };

  const handleContinue = () => {
    if (currentStep === "review") {
      handleSubmit();
      return;
    }
    const valid = validateStep(currentStep);
    if (valid) {
      markCompleted(currentStep);
      handleNext();
    }
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
        payload.append("coordinates", JSON.stringify(formData.coordinates));
      }

      formData.imageFiles.forEach((file) => {
        payload.append("images", file);
      });

      const filteredVideos = formData.videoLinks.filter(Boolean);
      payload.append("videoLinks", JSON.stringify(filteredVideos));

      // Declared document types only — no files. Verification team
      // follows up separately to collect copies.
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

  return (
    <div className="min-h-screen bg-background">
      <div
        className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-20"
        style={{ top: bannerHeight + 64 }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-foreground">List a Property</h1>
          <p className="text-sm text-muted-foreground">
            Step {stepIndex + 1} of {STEPS.length} — {stepTitle[currentStep]}
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-8 space-y-8">
        {draftAvailable && !draftDismissed && (
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm text-foreground">
              You have an unfinished listing. Continue where you left off?
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={discardDraft}
                className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
              <button
                type="button"
                onClick={keepDraft}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <PropertyStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleEditStep}
        />

        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
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
