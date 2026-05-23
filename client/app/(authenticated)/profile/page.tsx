"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  LuShield,
  LuBadgeCheck,
  LuClock,
  LuMapPin,
  LuHeart,
  LuWallet,
  LuBuilding,
  LuUsers,
  LuAward,
  LuTrendingUp,
  LuArrowUpRight,
  LuBriefcase,
} from "react-icons/lu";
import { FiAlertCircle } from "react-icons/fi";
import { useAuth } from "@/contexts/AuthContext";
import { SectionHeader, InfoRow, StatCard, Badge } from "@/components/ui";
import { Role, AgentSubRole, Company } from "@/types";
import { formatCompactPrice } from "@/lib/formatters";
import UserHeaderCard from "@/components/cards/UserHeaderCard";
import { Button } from "@/components/ui/Button";

const agentSubRoleLabels: Record<AgentSubRole, string> = {
  realtor: "Realtor",
  lawyer: "Lawyer",
  surveyor: "Surveyor",
  landlord: "Landlord",
  other: "Other",
};

export default function UserProfilePage() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = user ? `${user.name}'s Profile` : "Profile";
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 animate-fade-in">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-neutral-500">
          Loading your profile environment...
        </p>
      </div>
    );
  }

  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const isViewer = user.activeRole === Role.Viewer;

  const isCompanyPopulated =
    typeof user.companyId === "object" && user.companyId !== null;
  const companyIdString = isCompanyPopulated
    ? (user.companyId as Company)._id
    : user.companyId;
  const companyName = isCompanyPopulated
    ? (user.companyId as Company).name
    : "Associated Corporate Entity";
  const companyTypeLabel =
    isCompanyPopulated && (user.companyId as Company).type
      ? (user.companyId as Company).type.replace(/_/g, " ")
      : "Partnership Member";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <UserHeaderCard user={user} />

      {isViewer && user.viewerProfile && (
        <section className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <SectionHeader
            icon={LuHeart}
            title="Saved & Search Context"
            description="Personal real estate bookmarks and structural filtering limits"
          />
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/saved-properties">
              <StatCard
                label="Saved Properties"
                value={user.viewerProfile.savedListingIds?.length || 0}
                icon={LuHeart}
                accent="primary"
              />
            </Link>
            {user.viewerProfile.budgetRange && (
              <StatCard
                label="Target Budget Frame"
                value={`${user.viewerProfile.budgetRange.currency} ${formatCompactPrice(user.viewerProfile.budgetRange.min || 0, { currency: user.viewerProfile.budgetRange.currency })} – ${formatCompactPrice(user.viewerProfile.budgetRange.max || 0, { currency: user.viewerProfile.budgetRange.currency })}`}
                icon={LuWallet}
                accent="primary"
              />
            )}
          </div>
          {user.viewerProfile.preferredLocations &&
            user.viewerProfile.preferredLocations.length > 0 && (
              <div className="border border-border bg-neutral-50/50 dark:bg-neutral-900/30 rounded-xl p-4 flex flex-col justify-center">
                <h4 className="text-xs font-semibold tracking-wider uppercase text-neutral-400 mb-2.5">
                  Target Regions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.viewerProfile.preferredLocations.map((loc: string) => (
                    <Badge
                      key={loc}
                      variant="outline"
                      className="bg-background border-border hover:border-primary transition-colors py-1 px-2.5"
                    >
                      <LuMapPin className="mr-1.5 h-3 w-3 text-primary shrink-0" />
                      {loc}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </section>
      )}

      {isAgent && user.agentProfile && (
        <section className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <SectionHeader
            icon={LuAward}
            title={`${agentSubRoleLabels[user.agentProfile.subRole] || "Agent"} Pipeline`}
            description="Real-time listing metadata, promotional professional boosts, and operational compliance metrics"
          />

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatCard
                label="Active Account Listings"
                value={user.agentProfile.activeListings || 0}
                icon={LuBuilding}
                accent="primary"
              />
              <StatCard
                label="Active Boosted Placements"
                value={user.agentProfile.activeBoostedListings || 0}
                icon={LuTrendingUp}
                accent="warning"
              />
            </div>

            <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-border rounded-xl p-4 space-y-1.5 shadow-inner">
              <InfoRow
                hideLabelOnMobile={false}
                icon={LuBriefcase}
                label="Market Sub-Role Type"
                value={
                  agentSubRoleLabels[user.agentProfile.subRole] ||
                  user.agentProfile.subRole
                }
              />

              {user.agentProfile.subRole === "realtor" && (
                <>
                  <InfoRow
                    hideLabelOnMobile={false}
                    icon={LuAward}
                    label="Regulatory License Registration"
                    value={user.agentProfile.licenseNumber || "Not Registered"}
                  />
                  <InfoRow
                    hideLabelOnMobile={false}
                    icon={LuBuilding}
                    label="Associated Brokerage Office"
                    value={
                      user.agentProfile.brokerage || "Independent Practice"
                    }
                  />
                </>
              )}

              {user.agentProfile.subRole === "lawyer" && (
                <InfoRow
                  hideLabelOnMobile={false}
                  icon={LuAward}
                  label="Nigerian Bar Association (NBA) Number"
                  value={user.agentProfile.barNumber || "Not Registered"}
                />
              )}

              {user.agentProfile.subRole === "surveyor" && (
                <InfoRow
                  hideLabelOnMobile={false}
                  icon={LuAward}
                  label="Surveyor Registration Number"
                  value={
                    user.agentProfile.surveyorRegNumber || "Not Registered"
                  }
                />
              )}
            </div>
            <Button href="/dashboard" variant="outline">
              Full Detail in Dashboard
            </Button>
          </div>
        </section>
      )}

      {user.companyId && (
        <section className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <SectionHeader
            icon={LuUsers}
            title="Institutional Entity Association"
            description="Corporate workspace configurations, authorization parameters, and group boundaries"
          />
          <div className="grid md:grid-cols-5 gap-5">
            <div className="md:col-span-3 bg-neutral-50/50 dark:bg-neutral-900/30 border border-border rounded-xl p-4 space-y-1.5 shadow-inner">
              <InfoRow
                icon={LuBuilding}
                label="Corporate Workspace Name"
                value={companyName}
              />
              <InfoRow
                icon={LuBuilding}
                label="Registered Corporate ID"
                value={
                  typeof companyIdString === "string" ? companyIdString : "N/A"
                }
                mono
              />
              <InfoRow
                icon={LuShield}
                label="Internal Workspace Level"
                value={user.companyRole || "member"}
                badge
              />
              <InfoRow
                icon={LuClock}
                label="Association Timeline Point"
                value={
                  user.metadata?.lastRoleSwitch
                    ? new Date(
                        user.metadata.lastRoleSwitch,
                      ).toLocaleDateString()
                    : user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"
                }
              />
            </div>
            <div className="md:col-span-2 border border-border border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center bg-card">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary px-2 py-0.5 bg-primary/10 rounded-full mb-2">
                {companyTypeLabel}
              </span>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-60">
                Comprehensive company structures, programmatic structures, and
                team workflows are located in the business suite.
              </p>
              <Link
                href="/company/dashboard"
                className="inline-flex items-center gap-1.5 mt-3.5 text-xs font-semibold text-primary hover:text-primary-400 dark:hover:text-primary-300 transition-colors group"
              >
                Enter Organization Hub
                <LuArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {isCompany && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex gap-3.5 items-start">
          <FiAlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-foreground">
              Immutable Corporate Identity Account
            </h5>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This environment utilizes a locked corporate partnership identity
              configuration. Role switching workflows are restricted. Property
              listings, financial transaction histories, and verified CAC
              organizational mappings are aggregated directly at the corporate
              network layer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
