"use client";

import { useState, useEffect, useCallback } from "react";
import { LuArrowRight, LuArrowLeft, LuCircleHelp } from "react-icons/lu";
import { Modal } from "../ui";

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

type Direction = 1 | -1;

export function FeatureTour({ tourId, steps }: FeatureTourProps) {
  const storageKey = `${STORAGE_PREFIX}${tourId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>(1);
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
    setDirection(1);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
    }
  }, [storageKey]);

  const reopen = useCallback(() => {
    setStepIndex(0);
    setDirection(1);
    setIsOpen(true);
  }, []);

  /** Single entry point for navigation so `direction` is always in sync. */
  const goTo = useCallback(
    (next: number, dir: Direction) => {
      setDirection(dir);
      setStepIndex(next);
    },
    []
  );

  const goNext = useCallback(() => {
    if (stepIndex === steps.length - 1) return dismiss();
    goTo(stepIndex + 1, 1);
  }, [dismiss, goTo, stepIndex, steps.length]);

  const goPrev = useCallback(() => {
    if (stepIndex === 0) return;
    goTo(stepIndex - 1, -1);
  }, [goTo, stepIndex]);

  if (!isInitialized || steps.length === 0) return null;

  const step = steps[stepIndex];
  const Icon = step.icon;
  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

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
        <Modal open={isOpen} onClose={dismiss} aria-modal="true">

          <div onKeyDown={handleKeyDown} className="overflow-hidden">
            <div className="h-1 w-full bg-border/60">
              <div
                className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none"
                style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
              />
            </div>

            <div aria-live="polite">
              <div
                key={stepIndex}
                className={
                  direction === 1 ? "tour-step-in-forward" : "tour-step-in-backward"
                }
              >
                <div className="relative bg-primary/5 border-b border-border px-6 pt-6 pb-8">
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
                  <p className="text-sm text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goPrev}
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
                      onClick={() => i !== stepIndex && goTo(i, i > stepIndex ? 1 : -1)}
                      aria-label={`Go to step ${i + 1}`}
                      aria-current={i === stepIndex}
                      className={`h-1.5 rounded-full transition-all duration-300 ease-out ${
                        i === stepIndex
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-border hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goNext}
                  className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3.5 py-2 text-xs font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                >
                  {isLast ? "Got it, let's go" : "Next"}
                  {!isLast && <LuArrowRight className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}