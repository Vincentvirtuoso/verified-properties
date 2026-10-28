"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getErrorMessage } from "@/utils";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import {
  acceptCompanyInvitation,
  InviteError,
} from "@affilhomes/shared/supabase";
import { Button } from "@affilhomes/shared/ui";

const linkClass =
  "flex-1 inline-flex items-center justify-center h-10 rounded-lg text-sm font-medium transition-colors";

type FailureAction = "retry" | "switch" | "dashboard";

function describeFailure(
  error: InviteError,
  signedInEmail: string,
): { title: string; body: string; action: FailureAction } {
  switch (error.code) {
    case "not_found":
      return {
        title: "This link doesn't match an invitation",
        body: "If you were sent more than one invitation, use the most recent email. Otherwise the link may have been cut off when it was copied. You can also ask the person who invited you to send a new one.",
        action: "dashboard",
      };
    case "expired":
      return {
        title: "This invitation has expired",
        body: "Invitations are valid for 7 days. Ask the team admin to send a new one.",
        action: "dashboard",
      };
    case "revoked":
      return {
        title: "This invitation was cancelled",
        body: "Ask the team admin to send a new invitation if you still want to join.",
        action: "dashboard",
      };
    case "used":
      return {
        title: "This invitation has already been used",
        body: "If you joined with this link, your team is available from your dashboard. Otherwise, ask for a new invitation.",
        action: "dashboard",
      };
    case "wrong_email":
      return {
        title: "Sign in with the invited email",
        body: `This invitation was sent to ${error.invitedEmail ?? "a different email address"}. You're signed in as ${signedInEmail}. Use the account that matches the invitation.`,
        action: "switch",
      };
    case "unconfirmed":
      return {
        title: "Confirm your email first",
        body: "Open the confirmation email we sent you, then come back to this link.",
        action: "retry",
      };
    case "already_in_company":
      return {
        title: "Your account already belongs to a company",
        body: "An account can belong to one company at a time. To accept this invitation, sign in with a different account.",
        action: "switch",
      };
    case "pending_application":
      return {
        title: "Finish your partnership application first",
        body: "Your account has a partnership application in progress. Finish or cancel it, then accept this invitation.",
        action: "dashboard",
      };
    default:
      return {
        title: "We couldn't accept this invitation",
        body: "Try again. If it keeps happening, contact support.",
        action: "retry",
      };
  }
}

function InviteContent() {
  const { user, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [failure, setFailure] = useState<InviteError | null>(null);
  const [attempt, setAttempt] = useState(0);
  const started = useRef(false);

  const returnUrl = token
    ? `/invite?token=${encodeURIComponent(token)}`
    : "/invite";

  useEffect(() => {
    if (isLoading || !user || !token || started.current) return;
    started.current = true;

    const wasAgent = !!user?.agentProfile;
    acceptCompanyInvitation(token)
      .then(async () => {
        await refreshUser();
        router.replace(
          wasAgent ? "/dashboard?joined=team" : "/company/dashboard",
        );
      })
      .catch((err) => {
        setFailure(
          err instanceof InviteError
            ? err
            : new InviteError("unknown", "We couldn't accept this invitation."),
        );
      });
  }, [isLoading, user, token, refreshUser, router, attempt]);

  if (isLoading) return <PageSpinner label="Checking your invitation" />;

  const retry = () => {
    setFailure(null);
    started.current = false;
    setAttempt((n) => n + 1);
  };

  const switchAccount = async () => {
    await logout();
    router.replace(returnUrl);
  };

  const failureCopy =
    failure && user ? describeFailure(failure, user.email) : null;

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {!token ? (
          <>
            <h1 className="text-xl font-semibold">
              Invitation link incomplete
            </h1>
            <p className="text-sm text-muted">
              Open the full link from your invitation email.
            </p>
          </>
        ) : !user ? (
          <>
            <h1 className="text-xl font-semibold">You&apos;ve been invited</h1>
            <p className="text-sm text-muted">
              Sign in or create an account with the email address the invitation
              was sent to, then accept it.
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button
                href={`/login?callbackUrl=${encodeURIComponent(returnUrl)}`}
                className={`${linkClass} bg-primary text-primary-foreground hover:bg-primary/90`}
                size="xs"
                fullWidth
              >
                Sign in
              </Button>
              <Button
                size="xs"
                fullWidth
                href={`/register?next=${encodeURIComponent(returnUrl)}`}
                className={`${linkClass} border border-border text-foreground hover:bg-secondary`}
                variant="outline"
              >
                Create account
              </Button>
            </div>
          </>
        ) : failureCopy ? (
          <>
            <h1 className="text-xl font-semibold">{failureCopy.title}</h1>
            <p
              role="alert"
              className="text-sm text-rose-600 dark:text-rose-400"
            >
              {failureCopy.body}
            </p>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              {failureCopy.action === "retry" && (
                <Button
                  type="button"
                  onClick={retry}
                  variant="outline"
                  className={`${linkClass} border border-border text-foreground hover:bg-secondary`}
                  size="xs"
                >
                  Try again
                </Button>
              )}
              {failureCopy.action === "switch" && (
                <Button
                  type="button"
                  size="xs"
                  onClick={switchAccount}
                  className={`${linkClass} bg-primary text-primary-foreground hover:bg-primary/90`}
                >
                  Use a different account
                </Button>
              )}
              {failureCopy.action === "dashboard" && (
                <Button
                  type="button"
                  href="/dashboard"
                  size="xs"
                  className={`${linkClass} bg-primary text-primary-foreground hover:bg-primary/90`}
                >
                  Go to dashboard
                </Button>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">Joining the team…</p>
        )}
      </div>
    </main>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<PageSpinner label="Checking your invitation" />}>
      <InviteContent />
    </Suspense>
  );
}
