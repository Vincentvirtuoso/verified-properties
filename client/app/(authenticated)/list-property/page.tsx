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
import { useListPropertyForm, STEPS } from "./hooks/useListPropertyForm";
import type { ListPropertyStep } from "./hooks/useListPropertyForm";
import { useBannerHeightContext } from "@/contexts/BannerHeightContext";

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

      formData.imageFiles.forEach((file) => {
        payload.append("images", file);
      });

      const filteredVideos = formData.videoLinks.filter(Boolean);
      payload.append("videoLinks", JSON.stringify(filteredVideos));

      formData.documentFiles.forEach((doc, i) => {
        payload.append(`document_${i}`, doc.file);
        payload.append(`documentType_${i}`, doc.type);
      });
      payload.append("documentCount", String(formData.documentFiles.length));

      const res = await fetch("/api/properties", {
        method: "POST",
        body: payload,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to submit listing");

      const data = await res.json();
      router.push(`/dashboard/listings/${data.slug ?? data._id}`);
    } catch (err) {
      console.error(err);
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
        className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40"
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
    </div>
  );
}
