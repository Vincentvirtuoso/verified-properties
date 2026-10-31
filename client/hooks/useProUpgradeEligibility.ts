"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";
import { useEntitlements } from "./useEntitlements";

export function useProUpgradeEligibility() {
  const { user, companies, isLoading } = useAuth();

  const companyId =
    user?.activeRole === Role.Company
      ? typeof user.companyId === "string"
        ? user.companyId
        : user.companyId?._id
      : undefined;

  const company = companies.find((c) => c._id === companyId);

  const { tier, features, ready } = useEntitlements(company?._id);

  if (!company) return { eligible: false as const };

  return {
    eligible: company.verificationStatus === "verified" && tier === "standard",
    company: { ...company, features },
    isLoadingUserInfo: isLoading || !ready,
  } as const;
}
