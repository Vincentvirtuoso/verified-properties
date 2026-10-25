"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LuRefreshCw, LuShieldOff } from "react-icons/lu";

import { Button, Skeleton } from "@affilhomes/shared/ui";

import { useAuth } from "@/providers/AuthProvider";

export default function UnauthorizedPage() {
  const router = useRouter();
  const { logout, refreshUser, user, status, isLoggingOut, refreshSession } =
    useAuth();
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const shouldRedirect =
    status === "authenticated" ||
    status === "pending" ||
    status === "rejected" ||
    status === "suspended";

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
    else if (status === "pending") router.replace("/pending");
    else if (status === "rejected") router.replace("/rejected");
    else if (status === "suspended") router.replace("/suspended");
  }, [status, router]);

  const onCheck = async () => {
    setChecking(true);
    try {
      await refreshSession();
      await refreshUser();
      setCheckedAt(new Date());
    } finally {
      setChecking(false);
    }
  };

  const onSignOut = async () => {
    await logout();
  };

  if (status === "loading") return <UnauthorizedPageSkeleton />;
  if (shouldRedirect) return null;

  return (
    <div className="text-center">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <LuShieldOff size={22} />
      </div>

      <h1 className="text-lg font-semibold tracking-tight">
        You don&apos;t have admin access
      </h1>

      <p className="mt-2 text-sm text-muted-foreground">
        {user?.email
          ? `${user.email} is signed in, but this account isn't an active admin.`
          : "This account isn't an active admin."}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        If you applied recently, your request may still be under review.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        <Button
          onClick={onCheck}
          disabled={checking}
          isLoading={checking}
          fullWidth
          leftIcon={
            <LuRefreshCw
              size={14}
              className={checking ? "animate-spin" : undefined}
            />
          }
        >
          {checking ? "Checking…" : "Check status"}
        </Button>
        <Button
          variant="outline"
          onClick={onSignOut}
          isLoading={isLoggingOut}
          loadingText="Signing out"
          className="w-full"
        >
          Sign out
        </Button>
      </div>

      {checkedAt && (
        <p className="mt-4 text-xs text-muted-foreground">
          Last checked {checkedAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function UnauthorizedPageSkeleton() {
  return (
    <div className="text-center" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <Skeleton className="mx-auto mb-4 size-12 rounded-full" />

      <Skeleton className="mx-auto h-5 w-64 max-w-full" />

      <Skeleton className="mx-auto mt-3 h-4 w-80 max-w-full" />

      <Skeleton className="mx-auto mt-2 h-3 w-56 max-w-full" />

      <div className="mt-6 flex flex-col gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
