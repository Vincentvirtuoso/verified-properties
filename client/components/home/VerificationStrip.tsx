import Link from "next/link";

const POINTS = [
  {
    title: "Documents are shown as declared",
    body: "Each listing shows the documents its seller or agent has provided. Declared means provided, not independently checked.",
  },
  {
    title: "Every document has a guide",
    body: "Click any document on a listing to see what it proves, who issues it, and what to ask before you commit.",
  },
  {
    title: "Verify before you pay",
    body: "Take the documents to a lawyer or search at the relevant land registry before any payment or agreement.",
  },
];

export function VerificationStrip() {
  return (
    <section
      aria-labelledby="verification-heading"
      className="mx-auto mb-12 max-w-6xl px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-6 border-t border-border pt-8 md:flex-row md:gap-10">
        <div className="md:w-64 md:shrink-0">
          <h2
            id="verification-heading"
            className="text-lg font-semibold text-foreground"
          >
            How listings are presented
          </h2>
          <Link
            href="/help"
            className="mt-2 inline-block text-sm font-medium text-foreground underline underline-offset-2 hover:text-primary"
          >
            Read the help guide
          </Link>
        </div>

        <ol className="grid flex-1 gap-6 sm:grid-cols-3">
          {POINTS.map((point, i) => (
            <li key={point.title}>
              <p className="text-xs font-medium text-muted tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {point.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {point.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
