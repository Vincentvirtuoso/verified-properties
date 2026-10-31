"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Role } from "@affilhomes/shared/types";
import { useAuth } from "@/contexts/AuthContext";
import { hasAgentRole, hasCompanyAccess, isInAgentView } from "@/lib/access";
import { Button } from "@affilhomes/shared/ui";

const PRIMARY =
  "inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90";
const SECONDARY =
  "inline-flex h-11 w-full items-center justify-center rounded-lg border border-border text-sm font-medium text-foreground transition-colors hover:bg-secondary";

/* -------------------------------------------------------------------------- */
/*                                   Loader                                   */
/* -------------------------------------------------------------------------- */

function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.4s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      </div>
      <p className="text-sm text-muted">{label}…</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Access helpers                                */
/* -------------------------------------------------------------------------- */

function Denied({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm leading-relaxed text-muted">{body}</p>
        <div className="flex flex-col gap-2 pt-2">{children}</div>
      </div>
    </div>
  );
}

/** Sends signed-out visitors to login and returns them here afterwards. */
function useRedirectWhenSignedOut() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, pathname, router]);
}

function SwitchView({
  target,
  title,
  body,
}: {
  target: Role.Agent | Role.Company;
  title: string;
  body: string;
}) {
  const { switchRole, authLoading } = useAuth();
  const label = target === Role.Agent ? "agent" : "company";

  return (
    <Denied title={title} body={body}>
      <Button
        type="button"
        isLoading={authLoading}
        disabled={authLoading}
        onClick={() => {
          switchRole(target).catch((err) =>
            console.error("Role switch failed:", err),
          );
        }}
      >
        Switch to {label} view
      </Button>
    </Denied>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Guards                                    */
/* -------------------------------------------------------------------------- */

export function RequireAgent({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  useRedirectWhenSignedOut();

  if (isLoading || !user) return <Loading label="Checking access" />;

  if (!hasAgentRole(user)) {
    const canBecomeAgent =
      user.roles.includes(Role.Viewer) && !user.roles.includes(Role.Company);

    return (
      <Denied
        title="Agent account needed"
        body="Listing properties is for agent accounts."
      >
        {canBecomeAgent && (
          <Link href="/complete-registration?role=agent" className={PRIMARY}>
            Set up agent account
          </Link>
        )}
        <Link href="/dashboard" className={SECONDARY}>
          Back to dashboard
        </Link>
      </Denied>
    );
  }

  if (!isInAgentView(user)) {
    return (
      <SwitchView
        target={Role.Agent}
        title="Switch to your agent view"
        body="Your account is set to a different view right now."
      />
    );
  }

  return <>{children}</>;
}

export function RequireAgentOrCompany({ children }: { children: ReactNode }) {
  const { user, companies, isLoading } = useAuth();
  useRedirectWhenSignedOut();

  if (isLoading || !user) return <Loading label="Checking access" />;

  const isAgent = hasAgentRole(user);
  const isOwner = user.roles.includes(Role.Company);
  const isMember = hasCompanyAccess(user, companies);

  if (user.activeRole === Role.Agent) {
    if (isAgent) return <>{children}</>;
  }

  if (user.activeRole === Role.Company) {
    if (isOwner && isMember) return <>{children}</>;
    return (
      <Denied
        title="Couldn't load your company"
        body="Refresh the page. If this keeps happening, contact support."
      >
        <Link href="/dashboard" className={SECONDARY}>
          Back to dashboard
        </Link>
      </Denied>
    );
  }

  if (isAgent) {
    return (
      <SwitchView
        target={Role.Agent}
        title="Switch to your agent view"
        body="This page is for agent listings. Switch to your agent view to continue."
      />
    );
  }

  if (isOwner) {
    return (
      <SwitchView
        target={Role.Company}
        title="Switch to your company view"
        body="This page is for company listings. Switch to your company view to continue."
      />
    );
  }

  if (isMember) {
    return (
      <Denied
        title="Manage listings from your company"
        body="This page is for your own listings. To manage your company's listings, open the company."
      >
        <Link
          href={`/company/dashboard?company=${companies[0]._id}`}
          className={PRIMARY}
        >
          Open company
        </Link>
        <Link href="/dashboard" className={SECONDARY}>
          Back to dashboard
        </Link>
      </Denied>
    );
  }

  const canBecomeAgent =
    user.roles.includes(Role.Viewer) && !user.roles.includes(Role.Company);

  return (
    <Denied
      title="Agent or partnership access needed"
      body="This area is for agents and partnership companies."
    >
      {canBecomeAgent && (
        <Link href="/complete-registration?role=agent" className={PRIMARY}>
          Set up agent account
        </Link>
      )}
      <Link href="/register?accountType=company" className={SECONDARY}>
        Apply for Partnership
      </Link>
      <Link href="/dashboard" className={SECONDARY}>
        Back to dashboard
      </Link>
    </Denied>
  );
}

export function RequireCompany({ children }: { children: ReactNode }) {
  const { user, companies, isLoading, pendingRegistration } = useAuth();
  useRedirectWhenSignedOut();

  if (isLoading || !user) return <Loading label="Checking access" />;

  if (!hasCompanyAccess(user, companies)) {
    const applicationOpen =
      pendingRegistration?.status === "draft" ||
      pendingRegistration?.status === "docs_submitted";

    return (
      <Denied
        title="Company access needed"
        body="This area is for partnership companies and their team members. Apply for a partnership, or ask a company admin to invite you."
      >
        {applicationOpen ? (
          <Link href="/complete-registration?role=company" className={PRIMARY}>
            View your application
          </Link>
        ) : (
          <Link href="/register?accountType=company" className={PRIMARY}>
            Apply for Partnership
          </Link>
        )}
        <Link href="/dashboard" className={SECONDARY}>
          Back to dashboard
        </Link>
      </Denied>
    );
  }

  return <>{children}</>;
}
