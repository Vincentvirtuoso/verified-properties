import Link from "next/link";
import { LuArrowLeft, LuBuilding2, LuHouse } from "react-icons/lu";

export default function CompanyNotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <section className="w-full max-w-md bg-card border border-border rounded-2xl shadow-sm p-8 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
          <LuBuilding2 className="h-7 w-7" aria-hidden="true" />
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          We couldn&apos;t find this company
        </h1>
        <p className="mt-2 text-sm text-muted">
          The company may have been removed, or the link may be incorrect.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <LuHouse className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
          <Link
            href="/agents"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
            Browse agents
          </Link>
        </div>
      </section>
    </main>
  );
}
