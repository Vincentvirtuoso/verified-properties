"use client";

import Link from "next/link";
import { LuSparkles, LuChevronRight, LuCircleCheck } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useAiPlan } from "@/hooks/useAiPlan";

type Variant = "card" | "compact" | "banner";
type OwnerType = "company" | "agent";

interface AIPlanCTAProps {
  variant?: Variant;
  ownerType?: OwnerType;
  showWhenLive?: boolean;
}

const PLAN_HREF: Record<OwnerType, string> = {
  company: "/company/ai-plans",
  agent: "/dashboard/ai-plans",
};

export function AIPlanCTA({
  variant = "card",
  ownerType = "company",
  showWhenLive = false,
}: AIPlanCTAProps) {
  const { user, companies, isLoading } = useAuth();

  const company =
    ownerType === "company"
      ? companies.find(
          (c) =>
            c._id ===
            (typeof user?.companyId === "string"
              ? user.companyId
              : user?.companyId?._id),
        )
      : undefined;

  const membership = company?.team.find((m) => m.userId === user?._id);

  const canManage =
    ownerType === "agent"
      ? !!user
      : !!company &&
        (company.ownerId === user?._id ||
          (membership?.role === "admin" &&
            membership.permissions.includes("manage_billing")));

  const verified =
    ownerType === "agent"
      ? user?.agentProfile?.verificationStatus === "verified" &&
        !!user?.isEmailVerified
      : company?.verificationStatus === "verified";

  const ownerId = ownerType === "agent" ? user?._id : company?._id;
  const { live, ready } = useAiPlan(ownerType, ownerId);

  if (isLoading || !ready) return null;

  if (live) {
    if (!showWhenLive) return null;
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-5">
        <div className="flex items-center gap-3">
          <LuCircleCheck className="h-5 w-5 text-success" />
          <div>
            <p className="font-semibold text-foreground">
              AI calling is active
            </p>
            <p className="text-sm text-muted">Manage your plan and numbers.</p>
          </div>
        </div>
        <Button size="sm" variant="outline" href={PLAN_HREF[ownerType]}>
          Manage plan
        </Button>
      </div>
    );
  }

  if (!canManage || !verified) return null;

  const href = PLAN_HREF[ownerType];

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <LuSparkles className="h-3 w-3" />
        Set up AI calling
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <Link
        href={href}
        className="flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm transition-colors hover:border-primary/30"
      >
        <div className="flex items-center gap-2.5">
          <LuSparkles className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            <span className="font-medium">AI calling</span> can follow up on
            every enquiry automatically.
          </span>
        </div>
        <LuChevronRight className="h-4 w-4 shrink-0 text-muted" />
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
          <h2 className="text-lg font-semibold">Set up AI calling</h2>
          <p className="mt-1 text-sm text-muted">
            Automatically follow up on every enquiry with an AI call, so no lead
            goes cold waiting on a reply.
          </p>
        </div>
        <Button size="sm" href={href}>
          Choose a plan
        </Button>
      </div>
    </div>
  );
}
