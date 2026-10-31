"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  LuBuilding2,
  LuUsers,
  LuBanknote,
  LuCalendarDays,
  LuShieldCheck,
  LuPhone,
  LuMail,
  LuMessageCircle,
  LuCrown,
  LuSparkles,
  LuUserPlus,
  LuClock3,
  LuClipboardList,
} from "react-icons/lu";
import { FaWhatsapp } from "react-icons/fa";

import { useAuth } from "@/contexts/AuthContext";
import { InfoRow } from "@affilhomes/shared/ui/InfoRow";
import { Badge } from "@affilhomes/shared/ui/Badge";
import { Button } from "@affilhomes/shared/ui/Button";
import { Skeleton } from "@affilhomes/shared/ui/Skeleton";
import { formatPhoneNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useEntitlements } from "@/hooks/useEntitlements";
import UserHeaderCard from "@/components/common/UserHeaderCard";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { TeamMemberRow } from "@/components/company/TeamMemberRow";
import { AICallingCard } from "@/components/company/AICallingCard";
import { StatsCard } from "@/components/company/StatsCard";
import { VerifiedBadge } from "@affilhomes/shared/ui";
import { CompanyFaqs } from "@/components/company/CompanyFaqs";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const DAY_MS = 86_400_000;

const pageVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

function InfoRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-3.5 w-24" />
      </div>
      <Skeleton className="h-3.5 w-32 max-w-[45%]" />
    </div>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="mb-4 flex items-start gap-2.5">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full max-w-72" />
      </div>
    </div>
  );
}

function FeatureRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <Skeleton className="h-4 min-w-0 flex-1" />
      <Skeleton className="h-5 w-12 shrink-0 rounded-full" />
    </div>
  );
}

function TeamRowSkeleton() {
  return (
    <li className="flex items-center gap-3 py-3">
      <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
    </li>
  );
}

function CompanyDashboardSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-7xl space-y-6 pb-8 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading company dashboard"
    >
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-b border-border pb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-28" />
          <span className="text-muted/50">/</span>
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-8 w-64 max-w-full sm:h-9" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>

      <section aria-label="Company statistics" className="space-y-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="min-w-0 space-y-6">
          <Skeleton className="h-48 rounded-2xl" />

          <div className={SECTION_CLASS}>
            <SectionHeadingSkeleton />
            <div className="divide-y divide-border/70">
              <InfoRowSkeleton />
              <InfoRowSkeleton />
              <InfoRowSkeleton />
              <InfoRowSkeleton />
            </div>
          </div>

          <div className={SECTION_CLASS}>
            <SectionHeadingSkeleton />
            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureRowSkeleton />
              <FeatureRowSkeleton />
            </div>
          </div>
        </div>

        <aside className="min-w-0 space-y-6">
          <div className={SECTION_CLASS}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <SectionHeadingSkeleton />
              <Skeleton className="mt-1 h-5 w-8 shrink-0 rounded-full" />
            </div>
            <ul className="divide-y divide-border/70">
              <TeamRowSkeleton />
              <TeamRowSkeleton />
              <TeamRowSkeleton />
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-4/5" />
            <Skeleton className="mt-4 h-8 w-full rounded-full" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function CompanyDashboardPage() {
  const { user, companies, isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("company");

  const ownId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;

  const company =
    companies.find((item) => item._id === requestedId) ??
    companies.find((item) => item._id === ownId) ??
    companies[0];

  const { tier, features, isTrial, periodEnd, ready } = useEntitlements(
    company?._id,
  );

  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isLoading && user && companies.length === 0) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, companies.length, router]);

  if (isLoading || !ready) {
    return <CompanyDashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted">Please log in to view your company.</p>
      </div>
    );
  }

  if (!company) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/10">
          <LuBuilding2 className="h-8 w-8 text-muted" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">
            No company yet
          </h2>
          <p className="max-w-md text-sm leading-6 text-muted">
            You aren&apos;t linked to a company. Register your company to start
            listing properties and managing a team.
          </p>
        </div>
        <Button href="/register-company">Register a company</Button>
      </motion.div>
    );
  }

  const isVerified = company.verificationStatus === "verified";
  const isPending = company.verificationStatus === "pending";
  const isPro = tier === "pro";
  const isOwner = ownId === company._id;
  const isCompanyAdmin = company.team.some(
    (member) => member.userId === user._id && member.role === "admin",
  );

  const daysLeft =
    isTrial && periodEnd
      ? Math.max(
          0,
          Math.ceil((new Date(periodEnd).getTime() - Date.now()) / DAY_MS),
        )
      : null;

  const memberSince = new Date(company.createdAt).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
  });

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : pageVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate={shouldReduceMotion ? undefined : "show"}
      className="mx-auto w-full max-w-7xl space-y-6 pb-8 sm:space-y-8"
    >
      <motion.div variants={shouldReduceMotion ? undefined : sectionVariants}>
        <UserHeaderCard
          user={user}
          onProfileOpen={() => setProfileOpen(true)}
        />
      </motion.div>

      <motion.header
        variants={shouldReduceMotion ? undefined : sectionVariants}
        className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="min-w-0 space-y-3">
          <div className="space-y-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {company.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {isVerified ? (
                <VerifiedBadge size="lg" />
              ) : (
                <Badge variant="secondary">
                  {isPending ? "Verification pending" : "Unverified"}
                </Badge>
              )}
              <Badge variant={isPro ? "default" : "secondary"}>
                {isPro ? "Pro plan" : "Standard plan"}
                {isTrial && daysLeft !== null ? ` · ${daysLeft}d trial` : ""}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!isVerified && !isPending && (
            <Button
              href="/company/verify"
              size="sm"
              leftIcon={<LuShieldCheck className="h-4 w-4" />}
            >
              Complete verification
            </Button>
          )}
          <Button
            href="/company/team"
            size="sm"
            variant="outline"
            leftIcon={<LuUsers className="h-4 w-4" />}
          >
            Manage team
          </Button>
        </div>
      </motion.header>

      <motion.section
        variants={shouldReduceMotion ? undefined : sectionVariants}
        aria-label="Company statistics"
        className="space-y-3"
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground">At a glance</h2>
          <p className="mt-0.5 text-xs text-muted">
            A quick overview of your company&apos;s activity.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            icon={<LuBanknote className="h-5 w-5" />}
            label="Total remitted"
            value={naira.format(company.totalRemitted)}
          />
          <StatsCard
            icon={<LuBuilding2 className="h-5 w-5" />}
            label="Active listings"
            value={company.activeListings}
          />
          <StatsCard
            icon={<LuUsers className="h-5 w-5" />}
            label="Team members"
            value={company.team.length}
          />
          <StatsCard
            icon={<LuCalendarDays className="h-5 w-5" />}
            label="Member since"
            value={memberSince}
          />
        </div>
      </motion.section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="min-w-0 space-y-6">
          <motion.section
            variants={shouldReduceMotion ? undefined : sectionVariants}
            aria-label="AI calling"
          >
            <AICallingCard
              isVerified={isVerified}
              isPending={isPending}
              isPro={isPro}
            />
          </motion.section>

          <motion.section
            variants={shouldReduceMotion ? undefined : sectionVariants}
            className={SECTION_CLASS}
          >
            <SectionHeading
              title="Company details"
              description="Contact information and remittance details for your business."
              icon={<LuBuilding2 className="h-4 w-4" />}
            />

            <div className="divide-y divide-border/70">
              <InfoRow
                icon={LuMail}
                label="Contact email"
                value={company.contactEmail}
                mono
              />
              {company.contactPhone && (
                <InfoRow
                  icon={LuPhone}
                  label="Contact phone"
                  value={formatPhoneNumber(company.contactPhone)}
                  mono
                />
              )}
              {company.whatsappNumber && (
                <InfoRow
                  icon={FaWhatsapp}
                  label="WhatsApp"
                  value={formatPhoneNumber(company.whatsappNumber)}
                  mono
                />
              )}

              {isCompanyAdmin && company.remittanceDetails && (
                <>
                  <InfoRow
                    icon={LuBanknote}
                    label="Bank name"
                    value={company.remittanceDetails.bankName}
                  />
                  <InfoRow
                    icon={LuBanknote}
                    label="Account number"
                    value={company.remittanceDetails.accountNumber}
                    mono
                  />
                  <InfoRow
                    icon={LuBanknote}
                    label="Account name"
                    value={company.remittanceDetails.accountName}
                  />
                </>
              )}
            </div>
          </motion.section>

          <motion.section
            variants={shouldReduceMotion ? undefined : sectionVariants}
            className={SECTION_CLASS}
          >
            <SectionHeading
              title="Plan features"
              description={
                isPro
                  ? "Features currently available on your plan."
                  : "See what is included and what becomes available with Pro."
              }
              icon={<LuSparkles className="h-4 w-4" />}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FeatureRow
                icon={<LuMessageCircle className="h-4 w-4" />}
                label="WhatsApp notifications"
                active={features.whatsappNotifications}
              />
              <FeatureRow
                icon={<LuCrown className="h-4 w-4" />}
                label="Priority support"
                active={features.prioritySupport}
              />
            </div>
          </motion.section>
          <CompanyFaqs companyId={company._id} />
        </div>

        <aside className="min-w-0 space-y-6">
          <motion.section
            variants={shouldReduceMotion ? undefined : sectionVariants}
            className={SECTION_CLASS}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <SectionHeading
                title="Team members"
                description="People who help manage your company."
                icon={<LuUsers className="h-4 w-4" />}
              />
              <Badge variant="secondary">{company.team.length}</Badge>
            </div>

            {company.team.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/10">
                  <LuUserPlus className="h-5 w-5 text-muted" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Build your team
                  </p>
                  <p className="text-xs leading-5 text-muted">
                    Invite agents to help handle enquiries and manage your
                    listings.
                  </p>
                </div>
                <Button size="sm" variant="outline" href="/company/team">
                  Invite a member
                </Button>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/70">
                  {company.team.map((member) => (
                    <TeamMemberRow
                      key={member.userId}
                      member={member}
                      currentUserId={user._id}
                      companyId={company._id}
                    />
                  ))}
                </ul>
                <Button
                  href="/company/team"
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                >
                  Manage team
                </Button>
              </>
            )}
          </motion.section>

          <motion.section
            variants={shouldReduceMotion ? undefined : sectionVariants}
            className={cn(
              "rounded-2xl border p-5",
              isPro
                ? "border-primary/20 bg-card"
                : "border-primary/25 bg-primary/4",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LuSparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {isPro ? "Pro subscription" : "Explore Pro"}
                  </p>
                  <p className="text-xs text-muted">
                    {isPro ? "Your current plan" : "Unlock more capabilities"}
                  </p>
                </div>
              </div>
              <Badge variant={isPro ? "success" : "secondary"}>
                {isPro ? "Active" : "Standard"}
              </Badge>
            </div>

            <p className="mt-4 text-sm leading-6 text-muted">
              {isPro
                ? isTrial && daysLeft !== null
                  ? `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`
                  : "AI calling, AI chat and JV access are active on your subscription."
                : `Upgrade to Pro for ${naira.format(30_000_000 / 100)}/month and unlock AI calling, AI chat and JV access.`}
            </p>

            {isOwner ? (
              <Button
                href="/company/pro"
                className="mt-4 w-full"
                size="sm"
                leftIcon={<LuSparkles className="h-4 w-4" />}
              >
                {isPro ? "Manage subscription" : "Try Pro free for 7 days"}
              </Button>
            ) : (
              <p className="mt-4 rounded-lg bg-muted/10 px-3 py-2 text-xs leading-5 text-muted">
                Only the company owner can manage billing.
              </p>
            )}
          </motion.section>

          {!isVerified && (
            <motion.section
              variants={shouldReduceMotion ? undefined : sectionVariants}
              className={cn(
                "rounded-2xl border p-5",
                isPending
                  ? "border-warning/25 bg-warning/4"
                  : "border-warning/30 bg-warning/6",
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                  {isPending ? (
                    <LuClock3 className="h-4 w-4" />
                  ) : (
                    <LuShieldCheck className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-foreground">
                    {isPending
                      ? "Verification in progress"
                      : "Verify your company"}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {isPending
                      ? "Your company is under review, usually within 2–5 business days. You can prepare your AI assistant in draft mode while you wait."
                      : "Complete company verification to unlock partnership features, including AI calling on Pro."}
                  </p>
                  {!isPending && (
                    <Button
                      size="sm"
                      className="mt-3"
                      href="/company/verify"
                      variant="outline"
                    >
                      Start verification
                    </Button>
                  )}
                </div>
              </div>
            </motion.section>
          )}
        </aside>
      </div>

      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </motion.div>
  );
}

const SECTION_CLASS =
  "rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5";

function SectionHeading({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/10 text-muted">
        {icon}
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
      </div>
    </div>
  );
}

function FeatureRow({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3",
        active
          ? "border-border bg-background"
          : "border-dashed border-border bg-muted/3",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary/10 text-primary" : "bg-muted/10 text-muted",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-sm font-medium text-foreground">
        {label}
      </span>
      <Badge variant={active ? "success" : "secondary"}>
        {active ? "Active" : "Pro"}
      </Badge>
    </div>
  );
}
