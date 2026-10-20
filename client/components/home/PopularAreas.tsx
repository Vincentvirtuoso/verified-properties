import Link from "next/link";
import { getPopularAreas } from "@/lib/popular-areas";

export function PopularAreas() {
  const areas = getPopularAreas();
  if (areas.length === 0) return null;

  return (
    <section
      aria-labelledby="popular-areas-heading"
      className="mx-auto mb-12 max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2
          id="popular-areas-heading"
          className="text-lg font-semibold text-foreground"
        >
          Popular areas
        </h2>
        <Link
          href="/properties"
          className="text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          See all listings
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {areas.map((area) => (
          <li key={area.name}>
            <Link
              href={`/properties?${new URLSearchParams({ search: area.name })}`}
              className="flex h-full flex-col justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-medium text-foreground">
                {area.name}
              </span>
              {area.count !== null && (
                <span className="mt-3 text-xs text-muted tabular-nums">
                  {area.count} {area.count === 1 ? "listing" : "listings"}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
