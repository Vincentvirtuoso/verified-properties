import Link from "next/link";
import { LuHouse, LuSearch, LuArrowLeft } from "react-icons/lu";

interface PropertyNotFoundProps {
  slug?: string;
}

export function PropertyNotFound({ slug }: PropertyNotFoundProps) {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-20">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <LuHouse className="h-11 w-11 text-muted" aria-hidden="true" />
        </div>

        <p className="text-sm font-medium text-muted">Property not found</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          This listing is no longer available
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted">
          It may have been sold, rented, or removed.
          {slug && (
            <>
              {" "}
              The link{" "}
              <code className="rounded bg-muted/30 px-1.5 py-0.5 text-xs font-mono text-foreground/80">
                {slug}
              </code>{" "}
              doesn’t match any active property.
            </>
          )}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/properties"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LuSearch className="h-4 w-4" aria-hidden="true" />
            Browse properties
          </Link>

          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <p className="mt-10 text-sm text-muted">
          Need help?{" "}
          <Link
            href="/support"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
