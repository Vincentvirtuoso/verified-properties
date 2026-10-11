"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import {
  LuBuilding2,
  LuUsers,
  LuBanknote,
  LuClock,
  LuShield,
  LuPhone,
  LuMail,
  LuMessageCircle,
  LuChevronRight,
  LuCrown,
  LuHeadphones,
  LuUserCheck,
  LuSettings,
  LuPhoneCall,
  LuSparkles,
} from "react-icons/lu";
import { InfoRow } from "@/components/ui/InfoRow";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CompanyMember, companyTypeLabels, PopulatedUser } from "@/types";
import VerifiedBadge from "@/components/icons/VerifiedBadge";
import { useState } from "react";
import { formatPhoneNumber } from "@/lib/formatters";
import { FaWhatsapp } from "react-icons/fa";
import UserHeaderCard from "@/components/cards/UserHeaderCard";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { PageSpinner } from "@/components/ui/Spinner";
import { UpgradeToProCTA } from "@/components/common/UpgradeToProCTA";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function CompanyDashboardPage() {
  const { user, companies, isLoading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const companyId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;

  const company = companies.find((c) => c._id === companyId);

  if (isLoading) {
    return <PageSpinner label="Loading company dashboard" />;
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] space-y-4"
      >
        <LuBuilding2 className="h-16 w-16 text-muted/40" />
        <h2 className="text-xl font-semibold">No Company Found</h2>
        <p className="max-w-md text-center text-muted">
          You are not associated with any company. Create one to get started.
        </p>
        <Button>Create Company</Button>
      </motion.div>
    );
  }

  const isVerified = company.verificationStatus === "verified";
  const isPending = company.verificationStatus === "pending";
  const isPro = company.features.tier === "pro";

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 lg:px-8"
    >
      <UserHeaderCard user={user} onProfileOpen={() => setProfileOpen(true)} />

      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatsCard
          icon={<LuBanknote className="h-5 w-5" />}
          label="Total Remitted"
          value={`₦${company.totalRemitted.toLocaleString()}`}
        />
        <StatsCard
          icon={<LuBuilding2 className="h-5 w-5" />}
          label="Active Listings"
          value={company.activeListings}
        />
        <StatsCard
          icon={<LuUsers className="h-5 w-5" />}
          label="Team Members"
          value={company.team.length}
        />
        <StatsCard
          icon={<LuClock className="h-5 w-5" />}
          label="Member Since"
          value={new Date(company.createdAt).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
          })}
        />
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <motion.section variants={itemVariants}>
            <AICallingCard
              isVerified={isVerified}
              isPending={isPending}
              isPro={isPro}
            />
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">Company Details</h2>
            <div className="space-y-1">
              <InfoRow
                icon={LuMail}
                label="Contact Email"
                value={company.contactEmail}
                mono
              />
              {company.contactPhone && (
                <InfoRow
                  icon={LuPhone}
                  label="Contact Phone"
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
              {company.remittanceDetails && (
                <>
                  <InfoRow
                    icon={LuBanknote}
                    label="Bank Name"
                    value={company.remittanceDetails.bankName}
                  />
                  <InfoRow
                    icon={LuBanknote}
                    label="Account Number"
                    value={company.remittanceDetails.accountNumber}
                    mono
                  />
                  <InfoRow
                    icon={LuBanknote}
                    label="Account Name"
                    value={company.remittanceDetails.accountName}
                  />
                </>
              )}
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold">Enabled Features</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FeatureItem
                icon={<LuMessageCircle />}
                label="WhatsApp Notifications"
                active={company.features.whatsappNotifications}
              />
              <FeatureItem
                icon={<LuCrown />}
                label="Priority Support"
                active={company.features.prioritySupport}
              />
              <FeatureItem
                icon={<LuUserCheck />}
                label="Dedicated Account Manager"
                active={company.features.dedicatedAccountManager}
              />
              <FeatureItem
                icon={<LuShield />}
                label="White Label"
                active={company.features.whiteLabel}
              />
            </div>
          </motion.section>

          <motion.section
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Team Members</h2>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {company.team.length} member
                  {company.team.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="xs"
                  href="/company/team"
                  className="py-0 hover:bg-transparent"
                  leftIcon={<LuSettings />}
                >
                  Manage
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {company.team.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No team members yet.
                </p>
              ) : (
                company.team.map((member) => (
                  <TeamMemberRow
                    key={member.userId}
                    member={member}
                    user={user}
                  />
                ))
              )}
            </div>
          </motion.section>
        </div>

        <motion.div variants={itemVariants} className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <LuBuilding2 className="mr-2 h-4 w-4" />
                Manage Listings
                <LuChevronRight className="ml-auto h-4 w-4" />
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <LuUsers className="mr-2 h-4 w-4" />
                Manage Team
                <LuChevronRight className="ml-auto h-4 w-4" />
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <LuHeadphones className="mr-2 h-4 w-4" />
                Contact Support
                <LuChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isVerified && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <LuShield className="h-8 w-8 shrink-0 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-400">
                    {isPending ? "Verification Pending" : "Verification Needed"}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-500">
                    {isPending
                      ? "Under review (2-5 business days). You can configure your AI assistant in draft mode while you wait."
                      : "Complete verification to unlock Partnership features, including AI Calling on Pro."}
                  </p>
                </div>
              </div>
              {!isPending && (
                <Button size="sm" className="mt-4 w-full">
                  Verify Now
                </Button>
              )}
            </div>
          )}
        </motion.div>
      </div>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </motion.div>
  );
}

// Helper components

function StatsCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="text-xl font-semibold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}

function FeatureItem({
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
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        active
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-muted/20 text-muted"
      }`}
    >
      <span className={`text-lg ${active ? "text-primary" : "text-muted/50"}`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active ? (
        <VerifiedBadge
          variant="success"
          showText={false}
          size="lg"
          className="ml-auto"
        />
      ) : (
        <span className="ml-auto text-xs text-muted">Off</span>
      )}
    </div>
  );
}

function AICallingCard({
  isVerified,
  isPending,
  isPro,
}: {
  isVerified: boolean;
  isPending: boolean;
  isPro: boolean;
}) {
  if (isVerified && isPro) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuPhoneCall className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">AI Calling</h2>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Live
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Every new enquiry gets an automatic follow-up call. Review
              transcripts and outcomes in Enquiries.
            </p>
          </div>
          <Button variant="outline" size="sm" href="/enquiries">
            View Enquiries
            <LuChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isVerified && !isPro) {
    return <UpgradeToProCTA variant="card" />;
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30 text-muted">
          <LuPhoneCall className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-muted">AI Calling</h2>
          <p className="mt-1 text-sm text-muted">
            {isPending
              ? "You can start configuring your AI assistant now in draft mode. Activation unlocks once verification clears."
              : "Available on the Pro tier once your company is verified."}
          </p>
        </div>
        {isPending && (
          <Button variant="outline" size="sm">
            Configure Draft
          </Button>
        )}
      </div>
    </div>
  );
}

function TeamMemberRow({
  member,
  user,
}: {
  member: CompanyMember;
  user: PopulatedUser;
}) {
  const isCurrentUser = user._id === member.userId;
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {member.userId.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium">
            {member.userId}{" "}
            {isCurrentUser && <Badge className="ml-2 text-[10px]">YOU</Badge>}
          </p>
          <p className="text-xs text-muted">
            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
          </p>
        </div>
      </div>
      <div className="flex-1">
        <p className="mb-1 text-right text-[11px] font-bold text-muted">
          {isCurrentUser ? "My " : ""}Role
          {member.permissions.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap place-content-end gap-1">
          {member.permissions.map((perm) => (
            <Badge key={perm} variant="secondary" className="text-[10px]">
              {perm.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
