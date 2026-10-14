"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return <>{children}</>;
}
