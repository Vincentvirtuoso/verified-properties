"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LuUser,
  LuMail,
  LuPhone,
  LuShield,
  LuBadgeCheck,
  LuClock,
  LuMapPin,
  LuHeart,
  LuWallet,
  LuBanknote,
  LuBuilding,
  LuUsers,
  LuAward,
  LuTrendingUp,
  LuArrowUpRight,
  LuTriangleAlert,
} from "react-icons/lu";
import { FiAlertCircle } from "react-icons/fi";
import { useAuth } from "../../../contexts/AuthContext";
import {
  SectionHeader,
  InfoRow,
  StatCard,
  Badge,
  RoleBadge,
  LockedBadge,
} from "../../../components/ui";
import { Role } from "../../../types";
import VerifiedBadge from "../../../components/icons/VerifiedBadge";
import { formatCompactPrice, formatPhoneNumber } from "../../../lib/formatters";

export default function UserProfilePage() {
  const { user } = useAuth();

  const [imageError, setImageError] = useState(false);
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

  const isLockedRole =
    user.activeRole === Role.Developer || user.activeRole === Role.Company;
  const isLandlordOrAgent =
    user.activeRole === Role.Landlord || user.activeRole === Role.Agent;
  const isViewer = user.activeRole === Role.Viewer;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-fade-in">
      <div className="bg-card text-card-foreground border border-border rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
          <div className="relative h-24 w-24 shrink-0 shadow-lg rounded-full border-4 border-background overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {!imageError && user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                fill
                sizes="96px"
                className="object-cover transition-transform duration-300 hover:scale-105"
                priority
                onError={() => setImageError(true)}
              />
            ) : (
              <LuUser className="h-12 w-12 text-neutral-400" />
            )}
          </div>

          <div className="space-y-3 flex-1 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {user.name}
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Account ID: <span className="font-mono">{user._id}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {user.roles.map((role: Role) => (
                  <RoleBadge key={role} role={role} />
                ))}
                {isLockedRole && <LockedBadge />}
              </div>
            </div>

            <div className="h-px bg-border/60 my-2" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-y-2 gap-x-6 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                <LuMail className="h-4 w-4 text-primary" />
                {user.email}
                {user.isEmailVerified ? (
                  <VerifiedBadge showText={false} />
                ) : (
                  <LuTriangleAlert className="text-warning" />
                )}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
                  <LuPhone className="h-4 w-4 text-primary" />
                  {formatPhoneNumber(user.phone)}
                  {user.isPhoneVerified ? (
                    <VerifiedBadge showText={false} />
                  ) : (
                    <LuTriangleAlert className="text-warning" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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

      {isLandlordOrAgent && (
        <section className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <SectionHeader
            icon={user.activeRole === Role.Agent ? LuAward : LuBuilding}
            title={
              user.activeRole === Role.Agent
                ? "Agent Pipeline"
                : "Landlord Matrix"
            }
            description="Real-time listing metadata, promotional boosts, and deal compliance metrics"
          />

          {user.activeRole === Role.Agent && user.agentProfile && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                  label="Active Independent Listings"
                  value={user.agentProfile.activeListings || 0}
                  icon={LuAward}
                  accent="primary"
                />
                <StatCard
                  label="Currently Boosted Properties"
                  value={user.agentProfile.activeBoostedListings || 0}
                  icon={LuTrendingUp}
                  accent="warning"
                />
                <StatCard
                  label="Operator Compliance"
                  value={
                    user.agentProfile.verificationStatus === "verified"
                      ? "Verified Link"
                      : "Pending Action"
                  }
                  icon={LuBadgeCheck}
                  accent={
                    user.agentProfile.verificationStatus === "verified"
                      ? "success"
                      : "warning"
                  }
                />
              </div>
              <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-border rounded-xl p-4 space-y-1.5 shadow-inner">
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
                  value={user.agentProfile.brokerage || "Independent Practice"}
                />
                <InfoRow
                  hideLabelOnMobile={false}
                  icon={LuBadgeCheck}
                  label="Verification Status Mapping"
                  value={user.agentProfile.verificationStatus}
                  badge
                  badgeVariant="success"
                />
              </div>
            </div>
          )}

          {user.activeRole === Role.Landlord && user.landlordProfile && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                  label="Active Portfolios"
                  value={user.landlordProfile.activeListings || 0}
                  icon={LuBuilding}
                  accent="primary"
                />
                <StatCard
                  label="Lifetime Closing Remittance"
                  value={`₦${(user.landlordProfile.totalRemitted || 0).toLocaleString()}`}
                  icon={LuBanknote}
                  accent="success"
                />
                <StatCard
                  label="Operator Compliance"
                  value={
                    user.landlordProfile.verificationStatus === "verified"
                      ? "Active Status"
                      : "Pending Auditing"
                  }
                  icon={LuBadgeCheck}
                  accent={
                    user.landlordProfile.verificationStatus === "verified"
                      ? "success"
                      : "warning"
                  }
                />
              </div>
            </div>
          )}
        </section>
      )}

      {user.companyId && (
        <section className="bg-card text-card-foreground border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <SectionHeader
            icon={LuUsers}
            title="Institutional Entity Association"
            description="Corporate credentials, authorization parameters, and group boundaries"
          />
          <div className="grid md:grid-cols-5 gap-5">
            <div className="md:col-span-3 bg-neutral-50/50 dark:bg-neutral-900/30 border border-border rounded-xl p-4 space-y-1.5 shadow-inner">
              <InfoRow
                icon={LuBuilding}
                label="Registered Corporate ID"
                value={user.companyId._id}
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
              <p className="text-xs text-neutral-400 leading-relaxed max-w-60">
                Comprehensive company structures, programmatic balances, and
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

      {isLockedRole && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 flex gap-3.5 items-start">
          <FiAlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="text-sm font-semibold text-foreground">
              Immutable Corporate Identity Account
            </h5>
            <p className="text-xs text-neutral-400 leading-relaxed">
              This environment utilizes a locked institutional identity
              configuration. Role switching mechanics are restricted. Property
              listings, financial transaction flows, and 10% closing remittances
              are aggregated directly at the corporate organization layer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
