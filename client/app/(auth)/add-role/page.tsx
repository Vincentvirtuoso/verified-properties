"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types/user";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";

/**
 * A viewer can add the agent role once. Company owners and accounts that
 * already have the agent role cannot.
 * Team membership does not block this: it changes no roles.
 */
function canAddAgent(roles: Role[] | undefined, ownsCompany: boolean) {
  if (!roles) return false;
  return (
    roles.includes(Role.Viewer) &&
    !roles.includes(Role.Agent) &&
    !roles.includes(Role.Company) &&
    !ownsCompany
  );
}

function AddRoleContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const requestedRole = searchParams.get("to");
  const allowed =
    !!user &&
    requestedRole === Role.Agent &&
    canAddAgent(user.roles, !!user.companyId);

  useEffect(() => {
    if (!isLoading && allowed) {
      router.replace("/complete-registration?role=agent");
    }
  }, [isLoading, allowed, router]);

  if (isLoading || !user) {
    return <PageSpinner label="Loading your account…" />;
  }

  if (allowed) {
    return <PageSpinner label="Opening agent setup…" />;
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          You can&apos;t add this role
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your account already has this role, or it can&apos;t be added from
          here. Viewer accounts can add the agent role. Company accounts keep
          their existing roles.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default function AddRolePage() {
  return (
    <Suspense fallback={<PageSpinner label="Loading…" />}>
      <AddRoleContent />
    </Suspense>
  );
}