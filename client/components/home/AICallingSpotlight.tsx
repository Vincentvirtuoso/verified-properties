"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import {
  LuWifi,
  LuPhoneOff,
  LuSignal,
  LuPhone,
  LuBatteryFull,
  LuBot,
} from "react-icons/lu";

type SpotlightVariant = "guest" | "agent" | "company-locked" | "company-live";

interface SpotlightContent {
  label?: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

const HOW_IT_WORKS_HREF = "/academy/ai-calling";

function useSpotlightVariant(): {
  variant: SpotlightVariant;
  content: SpotlightContent;
} | null {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    const role = user?.activeRole;

    if (!isAuthenticated || role === Role.Viewer) {
      return {
        variant: "guest" as const,
        content: {
          headline: "No enquiry sits unanswered",
          body: "The moment you reach out about a listing, an assistant calls back to walk you through it — day or night.",
          ctaLabel: "See how it works",
          ctaHref: HOW_IT_WORKS_HREF,
        },
      };
    }

    if (role === Role.Agent) {
      return {
        variant: "agent" as const,
        content: {
          headline: "Every minute an enquiry waits, it cools",
          body: "Partnership accounts get an assistant that calls new leads back within moments of an enquiry — before they move on to another listing.",
          ctaLabel: "Upgrade to Partnership",
          ctaHref: "/register-company",
          secondaryLabel: "See how it works",
          secondaryHref: HOW_IT_WORKS_HREF,
        },
      };
    }

    if (role === Role.Company) {
      const company = user?.companyId;
      const isVerified =
        typeof company === "object" &&
        company?.verificationStatus === "verified";
      const hasAICalling = isVerified && company?.features?.tier === "pro";

      if (hasAICalling) {
        return {
          variant: "company-live" as const,
          content: {
            headline: "Your AI Calling is live",
            body: "Review recent calls, transcripts, and lead stages from your transaction dashboard.",
            ctaLabel: "Manage AI Calling",
            ctaHref: "/company/ai-calling",
            secondaryLabel: "How calls are handled",
            secondaryHref: HOW_IT_WORKS_HREF,
          },
        };
      }

      return {
        variant: "company-locked" as const,
        content: {
          headline: isVerified
            ? "Turn on AI Calling for your team"
            : "AI Calling is ready as soon as you're verified",
          body: isVerified
            ? "Pro unlocks an assistant that calls every new enquiry back automatically, logs the conversation, and tracks the buyer through to close."
            : "You can train your assistant now in draft mode — it activates the moment your CAC verification clears.",
          ctaLabel: isVerified ? "Upgrade to Pro" : "Set up your assistant",
          ctaHref: isVerified
            ? "/company/upgrade"
            : "/company/ai-calling/setup",
          secondaryLabel: "See how it works",
          secondaryHref: HOW_IT_WORKS_HREF,
        },
      };
    }

    return null;
  }, [user, isAuthenticated]);
}



const ASSISTANT_NAME = "Ada — AI Assistant";

function CallDemo() {
  return (
    <div className="w-full max-w-[220px]">
      <div
        role="img"
        aria-label={`Illustration: a phone screen showing an incoming call from ${ASSISTANT_NAME}, calling moments after a buyer's property enquiry.`}
        className="relative overflow-hidden rounded-[40px] border-[6px] border-zinc-800 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl ring-1 ring-black/5"
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 text-[11px] font-medium text-zinc-400">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <LuSignal className="text-xs" />
            <LuWifi className="text-xs" />
            <LuBatteryFull className="text-xs" />
          </div>
        </div>

        {/* Notch */}
        <div className="flex justify-center">
          <div className="-mt-4 h-5 w-15 rounded-full bg-black" />
        </div>

        {/* Call content */}
        <div className="px-6 pb-10 pt-10">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl text-white/90">
              <LuBot />
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm font-semibold text-white">
              {ASSISTANT_NAME}
            </p>
            <p className="mt-1.5 text-xs tracking-wide text-zinc-400">
              Calling…
            </p>
          </div>

          <div className="mt-12 flex items-center justify-center gap-10">
            <div
              aria-hidden="true"
              title="Decline"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/25"
            >
              <LuPhoneOff className="text-xl" />
            </div>
            <div
              aria-hidden="true"
              title="Answer"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/25"
            >
              <LuPhone className="text-xl" />
            </div>
          </div>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2">
          <div className="h-1 w-28 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}

export function AICallingSpotlight() {
  const result = useSpotlightVariant();
  const headingId = useId();

  if (!result) return null;

  const { variant, content } = result;
  const isLive = variant === "company-live";

  return (
    <section aria-labelledby={headingId} className="py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid lg:grid-cols-5">
            <div className="flex flex-col justify-center p-8 sm:p-12 lg:col-span-3">
              {isLive && (
                <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                  />
                  Active
                </span>
              )}

              {content.label && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  {content.label}
                </p>
              )}

              <h2
                id={headingId}
                className="max-w-md text-2xl font-bold leading-tight text-balance sm:text-3xl"
              >
                {content.headline}
              </h2>

              <p className="mt-4 max-w-md text-muted-foreground leading-relaxed text-pretty">
                {content.body}
              </p>

              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg">
                  <Link href={content.ctaHref}>{content.ctaLabel}</Link>
                </Button>

                {content.secondaryLabel && content.secondaryHref && (
                  <Link
                    href={content.secondaryHref}
                    className="inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  >
                    {content.secondaryLabel}
                  </Link>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center border-t border-border bg-background/60 p-6 sm:p-10 lg:col-span-2 lg:border-l lg:border-t-0">
              <CallDemo />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
