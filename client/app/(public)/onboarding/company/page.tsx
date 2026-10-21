"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LuBuilding,
  LuUsers,
  LuShieldCheck,
  LuHouse,
  LuCircleCheck,
  LuPhone,
  LuFileText,
  LuArrowRight,
} from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { useAuth } from "@/contexts/AuthContext";
import { useConfirm } from "@/contexts/ConfirmDialog";
import { FeatureTour, TourStep } from "@/components/common/FeatureTour";
import { Role } from "@/types";

const REGISTER_PATH = "/register?accountType=company";

const tourSteps: TourStep[] = [
  {
    icon: LuBuilding,
    title: "Register your company profile",
    description:
      "Use your registered business name, a square logo at least 200×200px, a business email and phone number, and choose whether you are a real estate company or a developer.",
  },
  {
    icon: LuUsers,
    title: "Add team members",
    description:
      "Assign admin or member roles. Admins have full control, members manage listings, and you can change the team anytime from settings.",
  },
  {
    icon: LuShieldCheck,
    title: "Verify your company",
    description:
      "Verification takes 2–5 business days. Have your documents ready before you submit. You can set up your dashboard while you wait.",
  },
  {
    icon: LuHouse,
    title: "Start listing properties",
    description:
      "Listings show your company name and logo. Boost featured listings, track inquiries from the dashboard, and add remittance details for payouts.",
  },
];

const requiredDocuments = [
  "CAC Certificate of Incorporation",
  "Memorandum & Articles of Association",
  "Company Tax ID (TIN)",
  "Tax Clearance Certificate",
  "Utility bill for the business address",
];

function AiCallingTease() {
  return (
    <section className="rounded-2xl border border-primary/30 bg-linear-to-br from-primary/5 to-transparent p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <LuPhone className="h-5 w-5" aria-hidden />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Never miss an enquiry
            </h2>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              Pro
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted">
            On the Pro plan, an AI assistant calls seekers the moment they send
            an enquiry, introduces itself as an assistant, and gives your team a
            summary. Set it up and train it while your verification is pending
            &mdash; it activates once your company is verified.
          </p>
        </div>
      </div>
    </section>
  );
}

function SignOutWarning({ role }: { role: Role | undefined }) {
  const roleLabel = role === Role.Viewer ? "viewer" : "agent";
  return (
    <div className="rounded-lg border border-warning/25 bg-warning/11 p-4">
      <p className="text-sm font-medium text-foreground">
        Heads up &mdash; this signs you out
      </p>
      <p className="mt-1 text-sm text-muted">
        Your current {roleLabel} account stays exactly as it is. The company
        account is registered separately.
      </p>
    </div>
  );
}

export default function CompanyOnboarding() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { confirm } = useConfirm();

  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompany = isAuthenticated && user?.activeRole === Role.Company;
  const isViewerOrAgent =
    isAuthenticated &&
    (user?.activeRole === Role.Viewer || user?.activeRole === Role.Agent);

  useEffect(() => {
    if (isCompany) router.replace("/company/dashboard");
  }, [isCompany, router]);

  const handleStart = async () => {
    if (loggingOut) return;
    setError(null);

    if (!isAuthenticated) {
      window.location.href = REGISTER_PATH;
      return;
    }
    if (!isViewerOrAgent) return;

    const confirmed = await confirm({
      title: "Create a separate company account",
      message:
        "You'll be logged out of your current account. It stays a Viewer or Agent account. You'll register your company as a new account. Continue?",
      confirmLabel: "Log out & continue",
      cancelLabel: "Stay here",
      variant: "warning",
    });

    if (!confirmed) return;

    setLoggingOut(true);
    try {
      await logout();
      window.location.href = REGISTER_PATH;
    } catch {
      setLoggingOut(false);
      setError("We couldn't sign you out. Please try again.");
    }
  };

  if (authLoading) return <PageLoading />;

  if (isCompany) {
    return (
      <Centered>
        <p className="text-sm text-muted" role="status" aria-live="polite">
          Taking you to your company dashboard&hellip;
        </p>
      </Centered>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LuBuilding className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">
            Register your company
          </h1>
        </div>
        <p className="text-sm leading-relaxed text-muted">
          Build your brand on the platform, manage a team, and list properties
          at scale. Have the documents below ready before you start.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <LuFileText className="h-4 w-4 text-muted" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">
            Documents you&apos;ll need
          </h2>
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {requiredDocuments.map((doc) => (
            <li key={doc} className="flex items-start gap-2 text-sm text-muted">
              <LuCircleCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </section>

      <AiCallingTease />

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        {isViewerOrAgent && <SignOutWarning role={user?.activeRole} />}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {isViewerOrAgent
              ? "Ready when you are. We'll sign you out first."
              : "About 10 minutes with your documents ready."}
          </p>
          <Button
            onClick={handleStart}
            isLoading={loggingOut}
            loadingText="Signing out…"
            size="lg"
            rightIcon={!loggingOut ? <LuArrowRight /> : undefined}
          >
            {isViewerOrAgent
              ? "Log out & register company"
              : "Register your company"}
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      <FeatureTour tourId="company-onboarding" steps={tourSteps} />
    </main>
  );
}

function PageLoading() {
  return (
    <main
      className="mx-auto max-w-3xl space-y-6 px-4 py-10"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-muted/30" />
        <div className="h-6 w-56 animate-pulse rounded bg-muted/30" />
      </div>
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/30" />
      <div className="h-40 animate-pulse rounded-2xl bg-muted/30" />
    </main>
  );
}
