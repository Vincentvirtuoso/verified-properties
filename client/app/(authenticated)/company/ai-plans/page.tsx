"use client";

import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AIPlans } from "@/components/billing/AIPlans";

export default function CompanyAIPlansPage() {
  return (
    <Suspense fallback={null}>
      <CompanyAIPlans />
    </Suspense>
  );
}

function CompanyAIPlans() {
  const { user, companies, authLoading } = useAuth();
  if (authLoading || !user) return null;

  const companyId =
    typeof user.companyId === "string" ? user.companyId : user.companyId?._id;
  const company = companies.find((c) => c._id === companyId);

  if (!company) {
    return (
      <p className="p-6 text-sm text-muted">
        You&apos;re not part of a company yet.
      </p>
    );
  }

  const membership = company.team.find((m) => m.userId === user._id);
  const canManage =
    company.ownerId === user._id ||
    (membership?.role === "admin" &&
      membership.permissions.includes("manage_billing"));

  return (
    <AIPlans
      ownerType="company"
      ownerId={company._id}
      canManage={canManage}
      verified={company.verificationStatus === "verified"}
      breadcrumbs={[
        { href: "/company/dashboard", label: "Dashboard" },
        { label: "AI calling plans" },
      ]}
    />
  );
}
