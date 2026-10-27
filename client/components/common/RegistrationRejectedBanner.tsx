"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LuCircleAlert } from "react-icons/lu";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";

const HIDDEN_ON_PREFIXES = ["/complete-registration"];

export function RegistrationRejectedBanner() {
  const { user, pendingRegistration } = useAuth();
  const pathname = usePathname();

  if (!user || user.activeRole === Role.Company) return null;
  if (pendingRegistration?.status !== "rejected") return null;
  if (HIDDEN_ON_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const reason = pendingRegistration.rejectionReason;

  return (
    <div
      role="alert"
      className="flex w-full items-center gap-3 border-b border-destructive p-3 bg-destructive"
    >
      <LuCircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">
          Your partnership application wasn&apos;t approved
        </p>
        {reason && (
          <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-300">
            {reason}
          </p>
        )}
      </div>

      <Link
        href="/complete-registration?role=company"
        className="shrink-0 pt-0.5 text-xs font-semibold underline underline-offset-2"
      >
        Update and resubmit
      </Link>
    </div>
  );
}
