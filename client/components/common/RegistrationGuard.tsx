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

export function RegistrationGuard({ children }: { children: React.ReactNode }) {
  const { user, pendingRegistration, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const mustResume =
    !!user && pendingRegistration?.status === "draft" && isProtected(pathname);

  useEffect(() => {
    if (!isLoading && mustResume) {
      router.replace("/complete-registration?role=company");
    }
  }, [isLoading, mustResume, router]);

  if (isLoading || mustResume) return null;
  return <>{children}</>;
}
