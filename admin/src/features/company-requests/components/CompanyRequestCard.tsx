"use client";

import { useEffect, useState } from "react";
import { LuBuilding2, LuExternalLink, LuFileText } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { AskReason, StatusPill } from "@/components/ui/ReviewActions";
import { useScreen } from "@/hooks/useScreen";
import {
  findMatchingCertificates,
  rejectCompanyRegistration,
  type CertificateMatch,
  type CompanyRequest,
  type RejectionScope,
} from "../api/companyRequests";
import { ApproveAction } from "./ApproveAction";
import Select from "@affilhomes/shared/ui/Select";

const TYPE_LABELS: Record<string, string> = {
  real_estate_company: "Real estate company",
  developer: "Property developer",
  broker: "Real estate brokerage",
};

const REJECTION_SCOPES: {
  value: RejectionScope;
  label: string;
  hint: string;
}[] = [
  {
    value: "cac_document",
    label: "CAC certificate",
    hint: "The applicant must upload a new certificate.",
  },
  {
    value: "details",
    label: "Company or applicant details",
    hint: "The applicant corrects the details and resubmits. The current certificate is reused.",
  },
  {
    value: "other",
    label: "Other",
    hint: "The applicant resubmits. The current certificate is reused.",
  },
];

const REJECT_SUGGESTIONS: Record<RejectionScope, string[]> = {
  cac_document: [
    "The CAC document is unreadable or incomplete.",
    "The certificate is not current. Upload a recent CAC certificate.",
    "The certificate is for a different company.",
  ],
  details: [
    "The company name doesn't match the CAC certificate.",
    "The contact details are incomplete or incorrect.",
    "The applicant is not named as a director or owner in the CAC documents.",
  ],
  other: [
    "The application is incomplete. Please check every section.",
    "Additional information is needed to verify this company.",
  ],
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface CompanyRequestCardProps {
  request: CompanyRequest;
  onChanged: () => void;
  onViewDocument: (path: string) => void;
}

export function CompanyRequestCard({
  request: r,
  onChanged,
  onViewDocument,
}: CompanyRequestCardProps) {
  const { isMobile } = useScreen();
  const [matches, setMatches] = useState<CertificateMatch[]>([]);
  const [scope, setScope] = useState<RejectionScope | "">("");

  useEffect(() => {
    if (!r.cacSha256) return;
    let cancelled = false;

    findMatchingCertificates(r.cacSha256, r.applicantId)
      .then((rows) => {
        if (!cancelled) setMatches(rows);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      });

    return () => {
      cancelled = true;
    };
  }, [r.cacSha256, r.applicantId]);

  const selectedScope = REJECTION_SCOPES.find((s) => s.value === scope);

  return (
    <li className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted"
          >
            <LuBuilding2 size={20} strokeWidth={1.8} />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="wrap-break-word text-sm font-semibold text-foreground sm:text-base">
                {r.companyName}
              </h3>
              <StatusPill tone="warning">Awaiting review</StatusPill>
            </div>

            <p className="text-xs text-muted">
              {TYPE_LABELS[r.companyType ?? ""] ?? "Company type not set"} ·
              Submitted {formatDate(r.submittedAt)}
            </p>

            <p className="text-sm text-foreground/80">
              Applicant: {r.applicantName}
              {r.applicantEmail && (
                <span className="text-muted"> · {r.applicantEmail}</span>
              )}
            </p>

            {r.applicantPhone && (
              <p className="text-xs text-muted">
                Applicant phone: {r.applicantPhone}
              </p>
            )}

            {!r.applicantAuthorised && (
              <p className="text-xs text-rose-600 dark:text-rose-400">
                No authorisation declaration on this application.
              </p>
            )}

            <p className="text-xs text-muted">
              Contact: {r.contactEmail ?? "not provided"}
              {r.contactPhone && ` · ${r.contactPhone}`}
              {r.whatsappNumber &&
                r.whatsappNumber !== r.contactPhone &&
                ` · WhatsApp ${r.whatsappNumber}`}
            </p>

            {matches.length > 0 && (
              <div
                role="note"
                className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200"
              >
                This certificate was also submitted for{" "}
                {matches
                  .map((m) => `${m.companyName} (${m.status})`)
                  .join(", ")}
                . Check before approving.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-72 lg:shrink-0">
          {r.cacCertPath ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDocument(r.cacCertPath!)}
            >
              <LuFileText size={14} aria-hidden="true" />
              View CAC certificate
              <LuExternalLink size={12} aria-hidden="true" />
            </Button>
          ) : (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              No CAC certificate on file. Reject with a reason so the applicant
              can resubmit.
            </p>
          )}

          <ApproveAction
            registrationId={r.id}
            companyName={r.companyName}
            onApproved={onChanged}
          />

          <div className="space-y-1.5 rounded-lg border border-border p-3">
            <Select
              label="Rejection is about"
              id={`scope-${r.id}`}
              value={scope}
              onChange={(value) => setScope(value as RejectionScope | "")}
              options={REJECTION_SCOPES}
              className="text-xs"
            />
          </div>

          <AskReason
            label="Reject"
            prompt={`Why is the application from ${r.companyName} being rejected?`}
            placeholder="Explain what the applicant needs to fix. They will see this message."
            confirmLabel="Reject application"
            destructive
            variant={isMobile ? "inline" : "modal"}
            suggestions={scope ? REJECT_SUGGESTIONS[scope] : []}
            onConfirm={async (reason) => {
              if (!scope) {
                throw new Error("Choose what the rejection is about first.");
              }
              await rejectCompanyRegistration(r.id, scope, reason);
              onChanged();
            }}
          />
        </div>
      </div>
    </li>
  );
}
