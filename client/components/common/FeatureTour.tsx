"use client";

import { useState, useEffect, useCallback } from "react";
import { LuX, LuArrowRight, LuArrowLeft, LuCircleHelp } from "react-icons/lu";

export interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

interface FeatureTourProps {
  /** Unique id for this tour — used as the localStorage key suffix. */
  tourId: string;
  steps: TourStep[];
}

const STORAGE_PREFIX = "featureTourDismissed:";

export function FeatureTour({ tourId, steps }: FeatureTourProps) {
  const storageKey = `${STORAGE_PREFIX}${tourId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) setIsOpen(true);
    setIsInitialized(true);
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setIsOpen(false);
    setStepIndex(0);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
    }
  }, [storageKey]);

  const reopen = useCallback(() => {
    setStepIndex(0);
    setIsOpen(true);
  }, []);

  if (!isInitialized || steps.length === 0) return null;

  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          onClick={reopen}
          aria-label="Show page guide"
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-transform"
        >
          <LuCircleHelp className="h-5 w-5" />
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
            <div className="relative bg-primary/5 border-b border-border px-6 pt-6 pb-8">
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close guide"
                className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
              >
                <LuX className="h-4 w-4" />
              </button>

              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Step {stepIndex + 1} of {steps.length}
              </span>

              <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Icon className="h-7 w-7" />
              </div>
            </div>

            <div className="px-6 pt-5 pb-6">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-6">
                {step.description}
              </p>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  disabled={isFirst}
                  className={`flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground transition-colors ${
                    isFirst ? "invisible" : ""
                  }`}
                >
                  <LuArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>

                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStepIndex(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === stepIndex
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-border hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    isLast ? dismiss() : setStepIndex((i) => i + 1)
                  }
                  className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  {isLast ? "Got it, let's go" : "Next"}
                  {!isLast && <LuArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
