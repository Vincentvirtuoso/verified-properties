"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";

type Step = {
  title: string;
  timing: string;
  body: string;
};

type PageVariant = "guest" | "agent" | "company-locked" | "company-live";

interface PageContent {
  eyebrow: string;
  headline: string;
  intro: string;
  steps: Step[];
  ctaTitle: string;
  ctaBody: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  footnote: string;
}

const BUYER_STEPS: Step[] = [
  {
    title: "You send an enquiry",
    timing: "Moments later",
    body: "Tap enquire on any listing and leave your number. No forms to fill out later.",
  },
  {
    title: "An assistant calls you back",
    timing: "Usually fast",
    body: "Not days later. Your assistant asks about your budget, timeline, and what you're looking for — so the agent isn't starting from zero.",
  },
  {
    title: "You pick a property, together",
    timing: "Same call",
    body: "Based on what you tell it, your assistant surfaces listings that actually fit and helps you move toward a viewing.",
  },
  {
    title: "Inspection gets scheduled",
    timing: "Before the visit",
    body: "Your assistant confirms a time that works, reminds you before the visit, and checks in afterwards to see what you thought.",
  },
];

const OPERATOR_STEPS: Step[] = [
  {
    title: "A buyer sends an enquiry",
    timing: "Moments later",
    body: "Your assistant calls them back automatically — no one on your team has to pick up the phone first.",
  },
  {
    title: "The buyer gets qualified",
    timing: "Same call",
    body: "Budget, timeline, and what they're looking for are captured before a human ever joins the conversation.",
  },
  {
    title: "The transaction moves forward",
    timing: "Ongoing",
    body: "Inspections get scheduled, reminders go out, and every call is logged against the deal — visible on your dashboard.",
  },
  {
    title: "You step in when it matters",
    timing: "As needed",
    body: "Legal checks, payments, and anything sensitive route to your team. The assistant handles follow-up, not judgment calls.",
  },
];

function usePageVariant(): { variant: PageVariant; content: PageContent } {
  const { user, isAuthenticated } = useAuth();

  return useMemo(() => {
    const role = user?.activeRole;

    if (role === Role.Agent) {
      return {
        variant: "agent" as const,
        content: {
          eyebrow: "For Partnership accounts",
          headline: "Your leads, called back automatically",
          intro:
            "This is what AI Calling does for a Partnership account — from a buyer's first enquiry to a scheduled inspection.",
          steps: OPERATOR_STEPS,
          ctaTitle: "Available on Partnership accounts",
          ctaBody:
            "Upgrade to Partnership to turn this on for your listings.",
          primaryLabel: "Upgrade to Partnership",
          primaryHref: "/register-company",
          secondaryLabel: "Back to Academy",
          secondaryHref: "/academy",
          footnote:
            "Calls are logged and recorded, subject to your team's consent and privacy settings.",
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
            eyebrow: "AI Calling",
            headline: "How your assistant handles enquiries",
            intro:
              "AI Calling is active on your account. Here's what happens at each stage of a buyer's journey.",
            steps: OPERATOR_STEPS,
            ctaTitle: "Your assistant is live",
            ctaBody:
              "Review recent calls, transcripts, and lead stages from your transaction dashboard.",
            primaryLabel: "Manage AI Calling",
            primaryHref: "/company/ai-calling",
            secondaryLabel: "Back to Academy",
            secondaryHref: "/academy",
            footnote:
              "Calls are logged and recorded, subject to your team's consent and privacy settings.",
          },
        };
      }

      return {
        variant: "company-locked" as const,
        content: {
          eyebrow: "AI Calling",
          headline: isVerified
            ? "Turn on AI Calling for your team"
            : "AI Calling is ready as soon as you're verified",
          intro: isVerified
            ? "Pro unlocks an assistant that calls every new enquiry back automatically. Here's what it does at each stage."
            : "You can train your assistant now in draft mode — it activates the moment your CAC verification clears.",
          steps: OPERATOR_STEPS,
          ctaTitle: isVerified ? "Ready to turn on" : "Set up while you wait",
          ctaBody: isVerified
            ? "Upgrade to Pro to activate AI Calling on your account."
            : "Configure your assistant's tone and FAQs now, so it's ready the moment verification clears.",
          primaryLabel: isVerified ? "Upgrade to Pro" : "Set up your assistant",
          primaryHref: isVerified
            ? "/company/upgrade"
            : "/company/ai-calling/setup",
          secondaryLabel: "Back to Academy",
          secondaryHref: "/academy",
          footnote:
            "Calls are logged and recorded, subject to your team's consent and privacy settings.",
        },
      };
    }

    // Guest / Viewer — default
    return {
      variant: "guest" as const,
      content: {
        eyebrow: "How it works",
        headline: "No enquiry sits unanswered",
        intro:
          "The moment you enquire about a listing, an assistant calls you back. Here's exactly what happens next — start to inspection day.",
        steps: BUYER_STEPS,
        ctaTitle: "Ready when you are",
        ctaBody: "Tap enquire on any listing and your assistant handles the rest.",
        primaryLabel: "Browse listings",
        primaryHref: "/properties",
        secondaryLabel: "Back to Academy",
        secondaryHref: "/academy",
        footnote:
          "We only use your number to call you back about the property you enquired about.",
      },
    };
  }, [user, isAuthenticated]);
}

export default function AICallingPageClient() {
  const { content } = usePageVariant();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight leading-tight text-balance">
            {content.headline}
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
            {content.intro}
          </p>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="sr-only">What happens at each stage</h2>

          <ol className="space-y-0">
            {content.steps.map((step, i) => {
              const isLast = i === content.steps.length - 1;

              return (
                <li
                  key={step.title}
                  className={`relative flex gap-5 sm:gap-6 ${
                    isLast ? "" : "pb-10 sm:pb-12"
                  }`}
                >
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-5 top-12 bottom-0 w-px bg-border"
                    />
                  )}

                  <div
                    aria-hidden="true"
                    className="relative z-10 shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold tabular-nums"
                  >
                    {i + 1}
                  </div>

                  <div className="min-w-0 flex-1 pt-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <h3 className="text-lg font-semibold text-foreground">
                        <span className="sr-only">
                          Step {i + 1} of {content.steps.length}:{" "}
                        </span>
                        {step.title}
                      </h3>
                      <span className="shrink-0 rounded-full bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {step.timing}
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground leading-relaxed text-pretty">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">
              {content.ctaTitle}
            </h2>
            <p className="mt-2 text-muted-foreground text-pretty">
              {content.ctaBody}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="sm" className="rounded-full py-3">
                <Link href={content.primaryHref}>{content.primaryLabel}</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="rounded-full py-3 border border-border"
              >
                <Link href={content.secondaryHref}>
                  {content.secondaryLabel}
                </Link>
              </Button>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              {content.footnote}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}