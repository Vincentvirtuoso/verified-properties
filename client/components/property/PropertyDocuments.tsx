"use client";

import Link from "next/link";
import { PropertyDocument } from "@affilhomes/shared/types/property";
import { DOCUMENT_TYPE_LABELS } from "@/utils";

const HELP_HREF = "/help";
const academyDocumentHref = (type: string) => `/academy/documents/${type}`;

interface PropertyDocumentsProps {
  documents: PropertyDocument[];
}

export default function PropertyDocuments({
  documents,
}: PropertyDocumentsProps) {
  if (!documents || documents.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-foreground">
        Documents
      </h2>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {documents.map((doc, idx) => {
          const typeLabel = DOCUMENT_TYPE_LABELS[doc.type];
          const title = doc.title || typeLabel;
          const showType = doc.title && doc.title !== typeLabel;

          return (
            <li key={doc.id || idx}>
              <Link
                href={academyDocumentHref(doc.type)}
                className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {title}
                  </p>
                  {showType && (
                    <p className="mt-0.5 text-xs text-muted">{typeLabel}</p>
                  )}
                  {doc.uploadedAt && (
                    <p className="mt-0.5 text-xs text-muted">
                      Added{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs font-medium text-muted">
                  Declared
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="mt-2 text-xs text-muted">
        Documents are declared by the seller or agent and are not available for
        download.{" "}
        <Link
          href={HELP_HREF}
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Learn what declared documents mean
        </Link>
        .
      </p>
    </section>
  );
}
