"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@affilhomes/shared/ui";
import { LuTriangleAlert } from "react-icons/lu";

export function SuspensionBanner() {
  const { isSuspended, suspensionReason } = useAuth();
  if (!isSuspended) return null;

  return (
    <section
      aria-labelledby="suspension-banner-title"
      className="w-full border-b border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 sm:px-6">
        <LuTriangleAlert
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        />

        <div className="min-w-0 flex-1 text-sm leading-snug text-amber-950 dark:text-amber-50">
          <p id="suspension-banner-title" className="font-semibold">
            Account suspended
            {suspensionReason && (
              <span className="font-normal text-amber-900 dark:text-amber-100">
                {" · "}
                {suspensionReason}
              </span>
            )}
          </p>
          <p className="text-xs text-amber-900/85 dark:text-amber-100/80">
            Browsing only. Creating listings is disabled.
          </p>
        </div>

        <Button
          href="/support"
          variant="outline"
          size="sm"
          className="shrink-0"
        >
          Appeal
        </Button>
      </div>
    </section>
  );
}
