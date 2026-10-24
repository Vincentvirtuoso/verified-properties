"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@affilhomes/shared/ui";
import { useAuth, type AuthStatus } from "@/providers/AuthProvider";

const STATUS_ROUTES: Partial<Record<AuthStatus, string>> = {
  pending: "/pending",
  rejected: "/rejected",
  suspended: "/suspended",
  unauthorized: "/unauthorized",
};

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    const target = STATUS_ROUTES[status];
    if (target && pathname !== target) {
      router.replace(target);
    }
  }, [status, pathname, router]);

  if (status === "loading") return <PageSkeleton />;

  if (status !== "authenticated") return null;

  return <>{children}</>;
}

function PageSkeleton() {
  return (
    <div
      className="mx-auto min-h-screen w-full max-w-5xl space-y-6 px-4 py-10"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading…</span>

      {/* page header */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      {/* stat row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="size-9 rounded-lg" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* main + side panel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card space-y-4 p-5 lg:col-span-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
        <div className="card space-y-3 p-5">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
