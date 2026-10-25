import Link from "next/link";
import {
  LuHouse,
  LuSearch,
  LuArrowLeft,
  LuCircleCheck,
  LuPause,
  LuClock,
} from "react-icons/lu";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PopulatedProperty } from "@affilhomes/shared/types";

export type UnavailableReason = "sold" | "rented" | "inactive" | "not_found";

interface PropertyNotFoundProps {
  slug?: string;
  reason?: UnavailableReason;
  similarProperties?: PopulatedProperty[];
}

const REASON_COPY: Record<
  UnavailableReason,
  { eyebrow: string; title: string; body: string; icon: React.ReactNode }
> = {
  sold: {
    eyebrow: "Sold",
    title: "This property has been sold",
    body: "It's no longer on the market. Here are similar homes you might like.",
    icon: (
      <LuCircleCheck
        className="h-11 w-11 text-emerald-600"
        aria-hidden="true"
      />
    ),
  },
  rented: {
    eyebrow: "Rented",
    title: "This property has been rented",
    body: "It's no longer available to rent. Here are similar homes you might like.",
    icon: (
      <LuCircleCheck className="h-11 w-11 text-blue-600" aria-hidden="true" />
    ),
  },
  inactive: {
    eyebrow: "Unavailable",
    title: "This listing is currently paused",
    body: "The owner has taken this listing offline. It may return later.",
    icon: <LuPause className="h-11 w-11 text-muted" aria-hidden="true" />,
  },
  not_found: {
    eyebrow: "Property not found",
    title: "We couldn't find this listing",
    body: "The link may be outdated, or the listing was removed.",
    icon: <LuHouse className="h-11 w-11 text-muted" aria-hidden="true" />,
  },
};

export function PropertyNotFound({
  slug,
  reason = "not_found",
  similarProperties = [],
}: PropertyNotFoundProps) {
  const copy = REASON_COPY[reason];
  const hasSimilar = similarProperties.length > 0;

  return (
    <main className="px-4 sm:px-6 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl">
        <div className="text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted/30">
            {copy.icon}
          </div>

          <p className="text-sm font-medium text-muted">{copy.eyebrow}</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            {copy.title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
            {copy.body}
            {reason === "not_found" && slug && (
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

          {reason === "not_found" && (
            <div className="mx-auto mt-6 flex max-w-xl gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left">
              <LuClock
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <div className="text-sm leading-relaxed">
                <p className="font-medium text-foreground">
                  Still under verification?
                </p>
                <p className="mt-1 text-muted">
                  New listings are checked before they go live. If you were
                  expecting this property, it may still be under review. Ask the
                  agent or company for an update, or check back in a few days.
                </p>
              </div>
            </div>
          )}
        </div>

        {hasSimilar && (
          <section className="mt-14" aria-labelledby="similar-heading">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2
                id="similar-heading"
                className="text-xl font-semibold text-foreground"
              >
                Similar properties
              </h2>
              <Link
                href="/properties"
                className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarProperties.slice(0, 3).map((property) => (
                <PropertyCard key={property._id} {...property} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/properties"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Browse properties
          </Link>
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-8 text-sm font-semibold text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LuArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to home
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-muted">
          Need help?{" "}
          <Link
            href="/support"
            className="font-medium text-foreground underline-offset-4 hover:underline hover:text-primary"
          >
            Contact support
          </Link>
        </p>
      </div>
    </main>
  );
}
