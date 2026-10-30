"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Company, PopulatedProperty } from "@affilhomes/shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import { CompanyClient } from "./CompanyClient";
import type { PublicCompanyAgent } from "@affilhomes/shared/supabase/publicDirectory";

export function CompanyPublicGate({
  company,
  agents,
  listings,
}: {
  company: Company;
  agents: PublicCompanyAgent[];
  listings: PopulatedProperty[];
}) {
  const { companies, isLoading } = useAuth();
  const router = useRouter();

  const isMember = !isLoading && companies.some((c) => c._id === company._id);

  useEffect(() => {
    if (isMember) {
      router.replace(`/company/dashboard?company=${company._id}`);
    }
  }, [isMember, company._id, router]);

  if (isLoading) return <PageSpinner label="Loading company" />;
  if (isMember) return <PageSpinner label="Opening your company workspace" />;

  return (
    <CompanyClient company={company} agents={agents} listings={listings} />
  );
}
