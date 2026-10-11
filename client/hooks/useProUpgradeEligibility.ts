"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";

export function useProUpgradeEligibility() {
  const { user, companies, isLoading } = useAuth();

  if (!user || user.activeRole !== Role.Company) {
    return { eligible: false as const };
  }

  const companyId =
    typeof user.companyId === "string" ? user.companyId : user.companyId?._id;
  const company = companies.find((c) => c._id === companyId);

  if (!company) return { eligible: false as const };

  const eligible =
    company.verificationStatus === "verified" &&
    company.features.tier === "standard";

  return { eligible, company, isLoadingUserInfo: isLoading } as const;
}
