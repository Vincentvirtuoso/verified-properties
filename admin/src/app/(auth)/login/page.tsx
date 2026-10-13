import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { Brandmark } from "@/components/ui/BrandMark";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <Brandmark/>
        <h1 className="text-xl font-semibold tracking-tight">
          Sign in to Admin
        </h1>
        <p className="text-sm text-muted">
          Owner and staff access only. All actions are logged.
        </p>
      </div>

      <Suspense fallback={<div className="h-64" />}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-xs text-muted">
        No account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary hover:underline"
        >
          Request access
        </Link>
      </p>
    </div>
  );
}
