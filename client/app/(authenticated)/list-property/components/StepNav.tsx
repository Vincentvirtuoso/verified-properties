"use client";

import { Button } from "@/components/ui/Button";
import { LuArrowLeft, LuArrowRight, LuSend } from "react-icons/lu";
import type { ListPropertyStep } from "../hooks/useListPropertyForm";
import { STEPS } from "../hooks/useListPropertyForm";

interface StepNavProps {
  currentStep: ListPropertyStep;
  onBack: () => void;
  onNext: () => void;
  isSubmitting?: boolean;
}

export function StepNav({
  currentStep,
  onBack,
  onNext,
  isSubmitting,
}: StepNavProps) {
  const stepIndex = STEPS.indexOf(currentStep);
  const isFirst = stepIndex === 0;
  const isLast = currentStep === "review";

  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
      <Button
        type="button"
        variant="ghost"
        size="md"
        leftIcon={<LuArrowLeft className="h-4 w-4" />}
        onClick={onBack}
        disabled={isFirst}
        className={isFirst ? "invisible" : ""}
      >
        Back
      </Button>

      <Button
        type="button"
        variant="primary"
        size="md"
        rightIcon={
          isLast ? (
            <LuSend className="h-4 w-4" />
          ) : (
            <LuArrowRight className="h-4 w-4" />
          )
        }
        onClick={onNext}
        isLoading={isSubmitting && isLast}
        loadingText="Submitting…"
      >
        {isLast ? "Submit Listing" : "Continue"}
      </Button>
    </div>
  );
}
