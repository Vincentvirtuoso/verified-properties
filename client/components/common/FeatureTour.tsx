"use client";

import { useState, useEffect, useCallback } from "react";
import { LuX, LuArrowRight, LuArrowLeft, LuCircleHelp } from "react-icons/lu";

export interface TourStep {
  title: string;
  description: string;
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

  if (!isInitialized || steps.length === 0) {
    // Still render the reopen trigger once initialized but closed, so
    // the page doesn't flash content before localStorage is checked.
    return null;
  }

  const step = steps[stepIndex];
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
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <span className="text-xs font-medium text-primary">
                {stepIndex + 1} of {steps.length}
              </span>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close guide"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LuX className="h-4 w-4" />
              </button>
            </div>

            <h3 className="text-base font-semibold text-foreground mb-1.5">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-5">
              {step.description}
            </p>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setStepIndex((i) => i - 1)}
                disabled={isFirst}
                className={`flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors ${
                  isFirst ? "invisible" : ""
                }`}
              >
                <LuArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === stepIndex ? "w-4 bg-primary" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  isLast ? dismiss() : setStepIndex((i) => i + 1)
                }
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:opacity-80 transition-opacity"
              >
                {isLast ? "Got it" : "Next"}
                {!isLast && <LuArrowRight className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
