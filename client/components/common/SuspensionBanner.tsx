"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@affilhomes/shared/ui";
import Link from "next/link";
import { LuTriangleAlert } from "react-icons/lu";

export function SuspensionBanner() {
  const { isSuspended, suspensionReason } = useAuth();
  if (!isSuspended) return null;

  const fullText = suspensionReason
    ? `Account suspended — ${suspensionReason}`
    : "Account suspended";

  return (
    <div
      role="alert"
      className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-900 sm:gap-3 sm:px-4 dark:border-amber-900/60 dark:bg-amber-800/50 dark:text-amber-100"
    >
      <LuTriangleAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="min-w-0 flex-1 truncate leading-tight" title={fullText}>
        <span className="font-medium">Account suspended</span>
        {suspensionReason ? (
          <span className="text-amber-800 dark:text-amber-200/80">
            {" — "}
            {suspensionReason}
          </span>
        ) : null}
        <span className="hidden text-amber-800/90 sm:inline dark:text-amber-200/70">
          {" · "}Browsing only; creating listings is disabled
        </span>
      </p>
      <Button
        href="/support"
        variant="ghost"
        size="xs"
        className="shrink-0 rounded-md font-medium text-amber-900 shadow-sm transition-colors hover:bg-amber-100 dark:border-amber-800 dark:text-foreground dark:hover:bg-amber-900 dark:focus-visible:ring-amber-400 dark:focus-visible:ring-offset-amber-950"
      >
        Appeal
      </Button>
    </div>
  );
}
