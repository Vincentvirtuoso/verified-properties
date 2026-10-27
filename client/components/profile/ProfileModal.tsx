"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LuShield,
  LuClock,
  LuHeart,
  LuWallet,
  LuBuilding,
  LuUsers,
  LuAward,
  LuArrowUpRight,
  LuBriefcase,
  LuCheck,
  LuLoader,
  LuArrowRight,
} from "react-icons/lu";
import { FiAlertCircle } from "react-icons/fi";
import { useSavedProperties } from "@/contexts/SavedPropertiesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader, InfoRow } from "@affilhomes/shared/ui";
import { Role, Company, agentSubRoleLabels } from "@affilhomes/shared/types";
import { formatCompactPrice } from "@/lib/formatters";
import {
  roleLabels,
  roleDescriptions,
  ProfileRole,
  getErrorMessage,
  format,
} from "@/utils";
import { StatCard } from "../ui";

const ROLE_HOME: Record<ProfileRole, string> = {
  [Role.Viewer]: "/dashboard",
  [Role.Agent]: "/dashboard",
  [Role.Company]: "/company/dashboard",
};

const HIDDEN_FROM_SWITCHER: Role[] = [Role.Admin, Role.SuperAdmin];

type ApplicationStatus = "draft" | "docs_submitted" | "rejected";

const APPLICATION_COPY: Record<
  ApplicationStatus,
  {
    title: string;
    body: (companyName: string, reason: string | null) => string;
    tone: string;
    cta?: { label: string; href: string };
  }
> = {
  draft: {
    title: "Application not finished",
    body: () =>
      "Finish your partnership application and send your CAC certificate. Your account stays a viewer account until it is approved.",
    tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200",
    cta: {
      label: "Finish application",
      href: "/complete-registration?role=company",
    },
  },
  docs_submitted: {
    title: "Application under review",
    body: (companyName) =>
      `We're verifying ${companyName || "your company"}. This usually takes 2 to 5 business days. Your account switches to a company account once it's approved.`,
    tone: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-900/10 dark:text-sky-200",
  },
  rejected: {
    title: "Application not approved",
    body: (_companyName, reason) =>
      reason
        ? `Reason: ${reason}`
        : "Review the details and documents, then resubmit.",
    tone: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-900/10 dark:text-rose-200",
    cta: {
      label: "Update and resubmit",
      href: "/complete-registration?role=company",
    },
  },
};

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, switchRole, pendingRegistration } = useAuth();
  const { savedCount } = useSavedProperties();
  const [switchingTo, setSwitchingTo] = useState<Role | null>(null);
  const [switchError, setSwitchError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const isViewer = user.activeRole === Role.Viewer;

  const switchableRoles = (user.roles ?? [user.activeRole]).filter(
    (role) => !HIDDEN_FROM_SWITCHER.includes(role),
  );

  const canSwitchRoles = !isCompany && switchableRoles.length > 1;

  const showApplication =
    !isCompany &&
    !!pendingRegistration &&
    pendingRegistration.status in APPLICATION_COPY;

  const handleSwitchRole = async (role: Role) => {
    if (role === user.activeRole || switchingTo) return;
    setSwitchError(null);
    setSwitchingTo(role);
    try {
      await switchRole(role);
      onClose();
      router.push(ROLE_HOME[role as ProfileRole]);
    } catch (err) {
      setSwitchError(
        getErrorMessage(err, "Couldn't switch role. Please try again."),
      );
    } finally {
      setSwitchingTo(null);
    }
  };

  const company =
    typeof user.companyId === "object" && user.companyId !== null
      ? (user.companyId as Company)
      : null;

  const companyIdString =
    company?._id ??
    (typeof user.companyId === "string" ? user.companyId : null);

  const companyName = company?.name ?? (companyIdString ? "Company" : null);

  const budget = user.viewerProfile?.budgetRange;
  const budgetLabel = budget
    ? `${budget.currency} ${formatCompactPrice(budget.min || 0, {
        currency: budget.currency,
      })} – ${formatCompactPrice(budget.max || 0, {
        currency: budget.currency,
      })}`
    : null;

  return (
    <Modal open={open} onClose={onClose} className="p-6 space-y-8">
      <h2 className="text-xl font-bold text-foreground">Your profile</h2>

      {canSwitchRoles && (
        <section className="space-y-6" aria-label="Switch role">
          <SectionHeader
            icon={LuUsers}
            title="Switch role"
            description="You have more than one account. Pick how you want to use the app right now."
          />

          <ul className="flex flex-col gap-2 sm:flex-row" role="list">
            {switchableRoles.map((role) => {
              const isActive = role === user.activeRole;
              const isBusy = switchingTo === role;

              return (
                <li key={role} className="flex-1">
                  <button
                    type="button"
                    onClick={() => handleSwitchRole(role)}
                    disabled={isActive || switchingTo !== null}
                    aria-current={isActive ? "true" : undefined}
                    aria-busy={isBusy || undefined}
                    className={[
                      "flex w-full items-center justify-between gap-3 rounded-xl border p-3.5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                      isActive
                        ? "border-primary/40 bg-primary/5"
                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/40",
                      switchingTo && !isBusy
                        ? "cursor-not-allowed opacity-50"
                        : "",
                    ].join(" ")}
                  >
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {roleLabels[role as ProfileRole]}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {roleDescriptions[role as ProfileRole]}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="flex h-6 w-6 shrink-0 items-center justify-center"
                    >
                      {isBusy ? (
                        <LuLoader className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
                      ) : isActive ? (
                        <LuCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <LuArrowUpRight className="h-4 w-4 text-muted" />
                      )}
                    </span>

                    {isActive && (
                      <span className="sr-only">Currently active</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {switchError && (
            <p
              role="alert"
              className="text-xs text-rose-600 dark:text-rose-400"
            >
              {switchError}
            </p>
          )}
        </section>
      )}

      {showApplication && pendingRegistration && (
        <section className="space-y-4" aria-label="Partnership application">
          <SectionHeader
            icon={LuBriefcase}
            title="Partnership application"
            description="Your company registration status"
          />

          <div
            className={`space-y-2 rounded-xl border p-4 text-sm ${
              APPLICATION_COPY[pendingRegistration.status as ApplicationStatus]
                .tone
            }`}
          >
            <p className="font-semibold">
              {
                APPLICATION_COPY[
                  pendingRegistration.status as ApplicationStatus
                ].title
              }
            </p>
            <p className="text-xs leading-relaxed">
              {APPLICATION_COPY[
                pendingRegistration.status as ApplicationStatus
              ].body(
                pendingRegistration.companyName,
                pendingRegistration.rejectionReason,
              )}
            </p>
            {APPLICATION_COPY[pendingRegistration.status as ApplicationStatus]
              .cta && (
              <Link
                href={
                  APPLICATION_COPY[
                    pendingRegistration.status as ApplicationStatus
                  ].cta!.href
                }
                onClick={onClose}
                className="inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2"
              >
                {
                  APPLICATION_COPY[
                    pendingRegistration.status as ApplicationStatus
                  ].cta!.label
                }
                <LuArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </section>
      )}

      {isViewer && (
        <section className="space-y-6" aria-label="Your activity">
          <SectionHeader
            icon={LuHeart}
            title="Your activity"
            description="What you've saved and the budget you're working with"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/saved-properties"
              onClick={onClose}
              className="rounded-2xl transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <StatCard
                label="Saved properties"
                value={savedCount}
                icon={LuHeart}
                accent="primary"
              />
            </Link>

            {budgetLabel && (
              <StatCard
                label="Budget range"
                value={budgetLabel}
                icon={LuWallet}
                accent="primary"
              />
            )}
          </div>
        </section>
      )}

      {isAgent && user.agentProfile && (
        <section className="space-y-6" aria-label="Agent details">
          <SectionHeader
            icon={LuAward}
            title={`${agentSubRoleLabels[user.agentProfile.subRole] || "Agent"} details`}
            description="Your licensing and registration information"
          />

          <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4">
            <InfoRow
              icon={LuBriefcase}
              label="Role"
              value={
                agentSubRoleLabels[user.agentProfile.subRole] ||
                user.agentProfile.subRole
              }
            />

            {user.agentProfile.subRole === "realtor" && (
              <>
                <InfoRow
                  icon={LuAward}
                  label="License number"
                  value={user.agentProfile.licenseNumber || "Not provided"}
                />
                <InfoRow
                  icon={LuBuilding}
                  label="Brokerage"
                  value={user.agentProfile.brokerage || "Independent"}
                />
              </>
            )}

            {user.agentProfile.subRole === "lawyer" && (
              <InfoRow
                icon={LuAward}
                label="NBA number"
                value={user.agentProfile.barNumber || "Not provided"}
              />
            )}

            {user.agentProfile.subRole === "surveyor" && (
              <InfoRow
                icon={LuAward}
                label="Surveyor registration"
                value={user.agentProfile.surveyorRegNumber || "Not provided"}
              />
            )}
          </div>
        </section>
      )}

      {user.companyId && (
        <section className="space-y-6" aria-label="Company">
          <SectionHeader
            icon={LuUsers}
            title={isCompany ? "Company account" : "Company"}
            description={
              isCompany
                ? "Your corporate account and workspace settings"
                : "The company workspace you belong to"
            }
          />

          <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-4">
            <InfoRow
              icon={LuBuilding}
              label="Company"
              value={companyName ?? "N/A"}
            />

            {companyIdString && (
              <InfoRow
                icon={LuBuilding}
                label="Company ID"
                value={companyIdString}
                mono
              />
            )}

            <InfoRow
              icon={LuShield}
              label="Your role"
              value={user.companyRole || "Member"}
              badge
            />

            <InfoRow
              icon={LuClock}
              label="Account created"
              value={format(user.createdAt, "do MMM yyyy")}
            />
          </div>

          {isCompany && pathname !== "/company/dashboard" && (
            <Link
              href="/company/dashboard"
              onClick={onClose}
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              Open company dashboard
              <LuArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          )}
        </section>
      )}

      {isCompany && (
        <div
          role="note"
          className="flex items-start gap-3.5 rounded-xl border border-warning/30 bg-warning/5 p-4"
        >
          <FiAlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-warning"
          />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              Company accounts can&apos;t switch roles
            </h3>
            <p className="text-xs leading-relaxed text-muted">
              This account is set up as a corporate workspace. If you need to
              use it differently, contact support and we&apos;ll sort it out.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
