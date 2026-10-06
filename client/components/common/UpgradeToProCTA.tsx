"use client";

import Link from "next/link";
import { LuSparkles, LuChevronRight } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { useProUpgradeEligibility } from "@/hooks/useProUpgradeEligibility";

type Variant = "card" | "compact" | "banner";

interface UpgradeToProCTAProps {
  variant?: Variant;
}

export function UpgradeToProCTA({ variant = "card" }: UpgradeToProCTAProps) {
  const { eligible } = useProUpgradeEligibility();

  if (!eligible) return null;

  if (variant === "compact") {
    return (
      <Link
        href="/company/pro"
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <LuSparkles className="h-3 w-3" />
        Upgrade to Pro
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <Link
        href="/company/pro"
        className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm transition-colors hover:border-primary/30"
      >
        <div className="flex items-center gap-2.5">
          <LuSparkles className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            <span className="font-medium">AI Calling</span> is available on Pro
            — follow up on every enquiry automatically.
          </span>
        </div>
        <LuChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LuSparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">
            Upgrade to Pro for AI Calling
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Automatically follow up on every enquiry with an AI call, so no lead
            goes cold waiting on a reply.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/company/pro">Upgrade to Pro</Link>
        </Button>
      </div>
    </div>
  );
}
