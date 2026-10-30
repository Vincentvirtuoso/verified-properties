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
} from "react-icons/lu";
import { InfoRow } from "@affilhomes/shared/ui/InfoRow";
import { Badge } from "@affilhomes/shared/ui/Badge";
import { Button } from "@affilhomes/shared/ui/Button";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatPhoneNumber } from "@/lib/formatters";
import { FaWhatsapp } from "react-icons/fa";
import UserHeaderCard from "@/components/common/UserHeaderCard";
import { ProfileModal } from "@/components/profile/ProfileModal";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import { TeamMemberRow } from "@/components/company/TeamMemberRow";
import { FeatureItem } from "@/components/company/FeatureItem";
import { AICallingCard } from "@/components/company/AICallingCard";
import { StatsCard } from "@/components/company/StatsCard";

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

  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("company");
  const ownId =
    typeof user?.companyId === "string" ? user.companyId : user?.companyId?._id;

  const company =
    companies.find((c) => c._id === requestedId) ??
    companies.find((c) => c._id === ownId) ??
    companies[0];

  useEffect(() => {
    if (!isLoading && user && companies.length === 0) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, companies.length, router]);

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
  const isCompanyAdmin = company.team.some(
    (m) => m.userId === user._id && m.role === "admin",
  );

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
              {isCompanyAdmin && company.remittanceDetails && (
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
                  leftIcon={<LuSettings />}
                >
                  Manage
                </Button>
              </div>
            </div>
            <div className="divide-y divide-border list-none">
              {company.team.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No team members yet.
                </p>
              ) : (
                company.team.map((member) => (
                  <TeamMemberRow
                    key={member.userId}
                    member={member}
                    currentUserId={user._id}
                    companyId={company._id}
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
