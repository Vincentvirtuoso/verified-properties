"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiSettings } from "react-icons/fi";
import { LuMail, LuPhone, LuTriangleAlert, LuUserRound } from "react-icons/lu";
import { Avatar } from "@affilhomes/shared/ui/Avatar";
import { Button } from "@affilhomes/shared/ui/Button";
import { LockedBadge, RoleBadge, VerifiedBadge } from "@affilhomes/shared/ui";
import {
  agentSubRoleLabels,
  Company,
  PopulatedUser,
  Role,
} from "@affilhomes/shared/types";
import { formatPhoneNumber } from "@/lib/formatters";
import { Modal } from "@/components/ui/Modal";
import { Logomark } from "../ui/LogoMark";
import { UserSettingsForm } from "./UserSettingsForm";

const SETTINGS_HASH = "#settings";

interface UserHeaderCardProps {
  user: PopulatedUser;
  onProfileOpen: () => void;
}

export default function UserHeaderCard({
  user,
  onProfileOpen,
}: UserHeaderCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const sync = () => setSettingsOpen(window.location.hash === SETTINGS_HASH);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
    router.push(`${pathname}${SETTINGS_HASH}`, { scroll: false });
  }, [pathname, router]);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    // Keep the query string (tabs, filters) and drop only the hash.
    router.replace(`${window.location.pathname}${window.location.search}`, {
      scroll: false,
    });
  }, [router]);

  const isCompany = user.activeRole === Role.Company;
  const isAgent = user.activeRole === Role.Agent;
  const company: Company | null =
    typeof user.companyId === "object" && user.companyId
      ? user.companyId
      : null;

  const isVerified = isCompany
    ? company?.verificationStatus === "verified"
    : isAgent
      ? user.agentProfile?.verificationStatus === "verified"
      : false;

  const needsVerification =
    isAgent && user.agentProfile?.verificationStatus !== "verified";

  const firstName = user.name.trim().split(/\s+/)[0] || "there";
  const subRoleLabel =
    isAgent && user.agentProfile?.subRole
      ? agentSubRoleLabels[user.agentProfile.subRole]
      : null;
  const greeting = subRoleLabel
    ? `Welcome back, ${subRoleLabel} ${firstName}`
    : `Welcome back, ${firstName}`;

  return (
    <section className="relative" aria-label="Your account">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 rounded-t-2xl bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent md:h-48" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-md transition-shadow duration-300 hover:shadow-lg">
        <div className="h-24 border-b border-border/50 bg-muted/20 md:h-32" />

        <div className="px-6 pb-6 md:px-8 md:pb-8">
          <div className="-mt-8 mb-4 flex flex-col items-start gap-5 sm:flex-row sm:items-end">
            <div className="flex items-end">
              <Avatar
                src={user.avatar}
                alt={user.name}
                name={user.name}
                size={90}
                shape="circle"
                className="border-5 border-background"
              />
              {company?.logo && (
                <Avatar
                  src={company.logo}
                  alt={company.name}
                  name={company.name}
                  shape="circle"
                  className="z-1 -ml-9 border-3 border-card object-cover"
                  fallbackIcon={<Logomark size={28} />}
                />
              )}
            </div>

            <div className="flex w-full flex-1 flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  <span className="break-words">{user.name}</span>
                  {isVerified && (
                    <>
                      <VerifiedBadge showText={false} />
                      <span className="sr-only">Verified</span>
                    </>
                  )}
                </h1>
                <p className="mt-1 text-xs text-muted">
                  Account ID
                  <span className="ml-2 rounded-sm bg-inverse px-2 py-1 font-mono">
                    {user._id}
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <RoleBadge role={user.activeRole} />
                {isCompany && company && <LockedBadge company={company} />}
              </div>
            </div>
          </div>

          <p className="mb-2 text-base font-semibold text-muted">{greeting}</p>

          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground">
              <LuMail
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-primary"
              />
              <span className="truncate">{user.email}</span>
              {user.isEmailVerified ? (
                <>
                  <VerifiedBadge showText={false} />
                  <span className="sr-only">Email verified</span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600">
                  <LuTriangleAlert
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="sr-only">Email not verified</span>
                </span>
              )}
            </div>

            {user.phone && (
              <div className="inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground">
                <LuPhone
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-primary"
                />
                <span>{formatPhoneNumber(user.phone)}</span>
                {user.isPhoneVerified ? (
                  <>
                    <VerifiedBadge showText={false} />
                    <span className="sr-only">Phone verified</span>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <LuTriangleAlert
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="sr-only">Phone not verified</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="my-4 h-px bg-border/60" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onProfileOpen}
                className="gap-2"
                leftIcon={<LuUserRound className="h-4 w-4" />}
              >
                View profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                aria-label="Edit profile settings"
                onClick={openSettings}
              >
                <FiSettings aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>

            {needsVerification && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-amber-600 hover:text-amber-700"
                leftIcon={<LuTriangleAlert className="h-4 w-4" />}
                href="/verification"
              >
                Verify your profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal open={settingsOpen} onClose={closeSettings}>
        {settingsOpen && (
          <UserSettingsForm
            user={user}
            company={company}
            onClose={closeSettings}
          />
        )}
      </Modal>
    </section>
  );
}
