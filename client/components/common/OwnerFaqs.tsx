import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@affilhomes/shared/ui/Accordion";
import type { PublicFaq } from "@affilhomes/shared/supabase";

export function OwnerFaqs({
  faqs,
  title = "Frequently asked questions",
}: {
  faqs: PublicFaq[];
  title?: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <section aria-labelledby="owner-faqs-heading" className="space-y-4">
      <h2
        id="owner-faqs-heading"
        className="text-xl font-semibold text-foreground"
      >
        {title}
      </h2>

      <Accordion>
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={faq.id} className="bg-card">
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
