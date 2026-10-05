"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { SectionHeader, InfoRow, StatCard } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Role, AgentSubRole, Company } from "@/types";
import { formatCompactPrice } from "@/lib/formatters";
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
} from "react-icons/lu";
import { FiAlertCircle } from "react-icons/fi";
import { roleLabels, roleDescriptions } from "@/utils/constants";

const agentSubRoleLabels: Record<AgentSubRole, string> = {
  realtor: "Realtor",
  lawyer: "Lawyer",
  surveyor: "Surveyor",
  landlord: "Landlord",
  other: "Other",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "N/A";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { user, switchRole } = useAuth();
  const [switchingTo, setSwitchingTo] = useState<Role | null>(null);

  if (!user) return null;

  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const isViewer = user.activeRole === Role.Viewer;

  const availableRoles: Role[] = user.roles ?? [user.activeRole];
  const canSwitchRoles = availableRoles.length > 1;

  const handleSwitchRole = async (role: Role) => {
    if (role === user.activeRole || switchingTo) return;
    try {
      setSwitchingTo(role);
      await switchRole(role);

      window.location.href = "/dashboard";
      onClose();
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
        <section className="space-y-6" aria-labelledby="profile-roles-heading">
          <SectionHeader
            icon={LuUsers}
            title="Switch role"
            description="You have more than one account. Pick how you want to use the app right now."
          />

          <ul id="profile-roles-heading" className="flex gap-2" role="list">
            {availableRoles.map((role) => {
              const isActive = role === user.activeRole;
              const isBusy = switchingTo === role;

              return (
                <li key={role}>
                  <button
                    type="button"
                    onClick={() => handleSwitchRole(role)}
                    disabled={isActive || switchingTo !== null}
                    aria-current={isActive ? "true" : undefined}
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
                        {roleLabels[role]}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {roleDescriptions[role]}
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
                        <LuArrowUpRight className="h-4 w-4 text-muted-foreground" />
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
        </section>
      )}

      {isViewer && user.viewerProfile && (
        <section
          className="space-y-6"
          aria-labelledby="profile-activity-heading"
        >
          <SectionHeader
            icon={LuHeart}
            title="Your activity"
            description="What you've saved and the budget you're working with"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/saved-properties"
              className="rounded-2xl transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <StatCard
                label="Saved properties"
                value={user.viewerProfile.savedListingIds?.length || 0}
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
        <section className="space-y-6" aria-labelledby="profile-agent-heading">
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
        <section
          className="space-y-6"
          aria-labelledby="profile-company-heading"
        >
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
              label="Member since"
              value={formatDate(
                user.metadata?.lastRoleSwitch || user.createdAt,
              )}
            />
          </div>

          <Link
            href="/company/dashboard"
            onClick={onClose}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            Open company dashboard
            <LuArrowUpRight
              aria-hidden="true"
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
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
            <p className="text-xs leading-relaxed text-muted-foreground">
              This account is set up as a corporate workspace. If you need to
              use it differently, contact support and we&apos;ll sort it out.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
