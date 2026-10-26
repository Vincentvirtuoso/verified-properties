"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LuArrowLeft, LuLayoutDashboard, LuSearchX } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui";
import { Centered } from "@affilhomes/shared/ui/Centered";

export default function AdminNotFound() {
  const router = useRouter();

  return (
    <Centered className="h-screen">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="mb-6 grid size-20 place-items-center rounded-2xl bg-primary/10 text-primary shadow-lg shadow-primary/10">
          <LuSearchX className="h-10 w-10" />
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">
          Error 404
        </p>

        <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
          This admin page doesn&apos;t exist
        </h1>

        <p className="mb-8 max-w-sm text-sm leading-relaxed text-muted">
          The page you tried to access isn&apos;t part of the admin panel, or
          you may not have permission to view it.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            fullWidth
            className="justify-center gap-2"
            leftIcon={<LuArrowLeft size={16} />}
          >
            Go back
          </Button>

          <Button
            asChild
            className="justify-center gap-2"
            href="/dashboard"
            fullWidth
            leftIcon={<LuLayoutDashboard size={16} />}
          >
            Admin dashboard
          </Button>
        </div>
      </div>
    </Centered>
  );
}
