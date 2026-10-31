"use client";

import { useEffect, useState } from "react";
import { createClient } from "@affilhomes/shared/supabase/client";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@affilhomes/shared/ui";

type PublicFaq = {
  id: string;
  question: string;
  answer: string;
};

export function CompanyFaqs({
  companyId,
  className,
}: {
  companyId: string;
  className?: string;
}) {
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoaded(false);

    createClient()
      .from("ai_faqs")
      .select("id, question, answer")
      .eq("company_id", companyId)
      .eq("enabled", true)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("Failed to load company FAQs:", error);
          setFaqs([]);
        } else {
          setFaqs((data as PublicFaq[]) ?? []);
        }

        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (!loaded || faqs.length === 0) return null;

  return (
    <section
      aria-labelledby={`faq-${companyId}`}
      className={cn("rounded-2xl border border-border bg-card p-5", className)}
    >
      <h2 id={`faq-${companyId}`} className="mb-3 text-base font-semibold">
        Frequently asked questions
      </h2>

      <Accordion className="space-y-0 divide-y divide-border">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.id}
            value={faq.id}
            className="rounded-none border-0"
          >
            <AccordionTrigger className="px-0 py-4 hover:bg-transparent">
              {faq.question}
            </AccordionTrigger>

            <AccordionContent className="px-0 pb-4 pt-0">
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
