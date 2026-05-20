"use client";

import { useRouter } from "next/navigation";
import { useState, ReactNode } from "react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/Checkbox";
import { cn } from "@/lib/utils";

interface Step {
  icon: ReactNode;
  title: string;
}

interface OnboardingLayoutProps {
  buttonClass?: string;
  title: string;
  subtitle: string;
  steps?: Step[];
  storageKey: string;
  nextRoute?: string;
  children: ReactNode;
  onContinue?: () => void;
}

export function OnboardingLayout({
  buttonClass = "bg-purple-600 hover:bg-purple-700",
  title,
  subtitle,
  // steps,
  storageKey,
  nextRoute,
  children,
  onContinue,
}: OnboardingLayoutProps) {
  const router = useRouter();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(storageKey, "true");
    }
    if (onContinue) {
      onContinue();
    } else {
      router.push(nextRoute || "");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border border-gray-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div
          className={cn("h-2 bg-linear-to-r from-purple-500 to-purple-600")}
        />

        <div className="p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600 dark:text-gray-400">
              <Checkbox
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              Don’t show this again
            </label>

            <button
              onClick={handleContinue}
              className={cn(
                "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg",
                buttonClass,
              )}
            >
              Continue
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
