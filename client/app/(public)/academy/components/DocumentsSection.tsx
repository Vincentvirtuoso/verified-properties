import Link from "next/link";
import { LuArrowRight, LuBookOpen } from "react-icons/lu";
import { DOCUMENT_GUIDES } from "@/utils/guides";
import type { PropertyDocumentType } from "@affilhomes/shared/types";

const FEATURED: PropertyDocumentType[] = [
  "certificateOfOccupancy",
  "governorsConsent",
  "deedOfAssignment",
  "surveyPlan",
  "excisionDocument",
  "deedOfMortgage",
];

const TOTAL_COUNT = Object.keys(DOCUMENT_GUIDES).length;

export default function DocumentsSection() {
  const featured = FEATURED.map((type) => ({
    type,
    ...DOCUMENT_GUIDES[type],
  }));

  return (
    <section aria-labelledby="docs-heading" className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Document guides
            </p>
            <h2
              id="docs-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
            >
              Property documents, explained
            </h2>
            <p className="mt-3 leading-relaxed text-muted">
              Every listing declares its documents. These guides explain what
              each one proves, who issues it, and what to check before you
              commit.
            </p>
          </div>

          <Link
            href="/academy/documents"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0"
          >
            <LuBookOpen size={14} aria-hidden="true" />
            Browse all {TOTAL_COUNT} guides
            <LuArrowRight size={13} aria-hidden="true" />
          </Link>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((guide) => (
            <li key={guide.type}>
              <Link
                href={`/academy/documents/${guide.type}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                    {guide.name}
                  </p>
                  <LuArrowRight
                    size={14}
                    aria-hidden="true"
                    className="shrink-0 mt-0.5 text-muted opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
                  />
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
                  {guide.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
