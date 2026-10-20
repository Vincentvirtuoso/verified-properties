import { Button } from "@affilhomes/shared/ui";

const POINTS = [
  "Answers buyer and renter enquiries at any hour",
  "Asks qualifying questions about budget, location, and timing",
  "Passes serious prospects to an agent with a call summary",
];

export default function AiCallingSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            AI calling for property enquiries
          </h2>
          <p className="mt-3 leading-relaxed text-muted">
            Learn how automated calls handle first contact with prospects, what
            they can and cannot answer, and how to keep them accurate.
          </p>
          <Button
            href="/academy/ai-calling"
            variant="outline"
            size="sm"
            className="mt-5"
          >
            Read the AI calling guide
          </Button>
        </div>

        <ul className="space-y-3 text-sm text-foreground">
          {POINTS.map((point) => (
            <li
              key={point}
              className="rounded-lg border border-border px-4 py-3"
            >
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
