"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const PROTECTED = [
  "/dashboard",
  "/company",
  "/list-property",
  "/profile",
  "/my-listings",
  "/enquiries",
  "/saved-properties",
  "/verification",
];

function isProtected(pathname: string) {
  return PROTECTED.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

function Redirecting() {
  return (
    <div
      className="flex min-h-[70vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.4s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      </div>
      <p className="text-sm text-muted">Finishing your registration…</p>
    </div>
  );
}

export function RegistrationGuard({ children }: { children: React.ReactNode }) {
  const { user, pendingRegistration, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const mustResume =
    !isLoading &&
    !!user &&
    pendingRegistration?.status === "draft" &&
    isProtected(pathname);

  useEffect(() => {
    if (mustResume) {
      router.replace("/complete-registration?role=company");
    }
  }, [mustResume, router]);

  if (mustResume) return <Redirecting />;

  return <>{children}</>;
}
