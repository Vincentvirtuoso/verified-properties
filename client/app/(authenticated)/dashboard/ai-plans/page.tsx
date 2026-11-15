"use client";

import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AIPlans } from "@/components/billing/AIPlans";
import { RequireAgent } from "@/components/access/RouteGates";

export default function AgentAIPlansPage() {
  return (
    <RequireAgent>
      <Suspense fallback={null}>
        <AgentAIPlans />
      </Suspense>
    </RequireAgent>
  );
}

function AgentAIPlans() {
  const { user, authLoading } = useAuth();
  if (authLoading || !user) return null;

  return (
    <div className="p-4 sm:p-6">
      <AIPlans
        ownerType="agent"
        ownerId={user._id}
        canManage
        verified={user.agentProfile?.verificationStatus === "verified"}
        breadcrumbs={[
          { href: "/dashboard", label: "Dashboard" },
          { label: "AI calling plans" },
        ]}
      />
    </div>
  );
}
