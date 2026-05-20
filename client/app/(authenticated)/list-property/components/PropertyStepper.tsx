"use client";

import { cn } from "@/lib/utils";
import { LuCheck } from "react-icons/lu";
import type { ListPropertyStep } from "../hooks/useListPropertyForm";
import { STEPS } from "../hooks/useListPropertyForm";

const STEP_META: Record<ListPropertyStep, { label: string; short: string }> = {
  basic: { label: "Basic Info", short: "Info" },
  details: { label: "Details & Price", short: "Details" },
  location: { label: "Location", short: "Location" },
  media: { label: "Photos & Docs", short: "Media" },
  review: { label: "Review & Submit", short: "Review" },
};

interface PropertyStepperProps {
  currentStep: ListPropertyStep;
  onStepClick?: (step: ListPropertyStep) => void;
  completedSteps?: ListPropertyStep[];
}

export function PropertyStepper({
  currentStep,
  onStepClick,
  completedSteps = [],
}: PropertyStepperProps) {
  const currentIndex = STEPS.indexOf(currentStep);

  return (
    <nav aria-label="Form progress" className="w-full">
      <div className="flex sm:hidden flex-col gap-2 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            {STEP_META[currentStep].label}
          </span>
          <span className="text-muted-foreground">
            Step {currentIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden sm:flex items-center w-full">
        {STEPS.map((step, index) => {
          const isCompleted =
            completedSteps.includes(step) || index < currentIndex;
          const isCurrent = step === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <li key={step} className="flex-1 flex items-center">
              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center gap-1.5 group w-full",
                  isClickable ? "cursor-pointer" : "cursor-default",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                        ? "border-primary bg-background text-primary shadow-sm shadow-primary/20"
                        : "border-border bg-background text-muted-foreground",
                  )}
                >
                  {isCompleted ? (
                    <LuCheck className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent
                      ? "text-foreground"
                      : isCompleted
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {STEP_META[step].short}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-2 -mt-4.5">
                  <div
                    className={cn(
                      "h-full transition-colors duration-500",
                      index < currentIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
