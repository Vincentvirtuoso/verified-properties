"use client";

import { Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@affilhomes/shared/ui";
import { Centered } from "@affilhomes/shared/ui/Centered";
import { LuLock } from "react-icons/lu";

function safeCallback(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export function SignInPrompt({
  title,
  description,
  callbackUrl,
}: {
  title: string;
  description: string;
  callbackUrl?: string;
}) {
  return (
    <Centered>
      <LuLock className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
      <h1 className="mb-2 text-2xl font-bold text-foreground">{title}</h1>
      <p className="mb-6 text-subtle">{description}</p>
      <Suspense fallback={<Button href="/login">Sign in</Button>}>
        <SignInButton callbackUrl={callbackUrl} />
      </Suspense>
    </Centered>
  );
}

function SignInButton({ callbackUrl }: { callbackUrl?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const returnTo = useMemo(() => {
    if (callbackUrl) return safeCallback(callbackUrl);
    const qs = searchParams?.toString();
    return safeCallback(qs ? `${pathname}?${qs}` : pathname);
  }, [callbackUrl, pathname, searchParams]);

  return (
    <Button href={`/login?callbackUrl=${encodeURIComponent(returnTo)}`}>
      Sign in
    </Button>
  );
}
