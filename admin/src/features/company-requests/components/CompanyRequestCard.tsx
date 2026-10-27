"use client";

import { LuBuilding2, LuExternalLink, LuFileText } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { AskReason, StatusPill } from "@/components/ui/ReviewActions";
import type { CompanyRequest } from "../api/companyRequests";
import { ApproveAction } from "./ApproveAction";
import { rejectCompanyRegistration } from "../api/companyRequests";

const TYPE_LABELS: Record<string, string> = {
  real_estate_company: "Real estate company",
  developer: "Property developer",
  broker: "Real estate brokerage",
};

const REJECT_SUGGESTIONS = [
  "The CAC document is unreadable or incomplete.",
  "The company name doesn't match the CAC certificate.",
  "The certificate is not current.",
];

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
  return (
    <li className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
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

            <p className="text-xs text-muted">
              Contact: {r.contactEmail ?? "not provided"}
              {r.contactPhone && ` · ${r.contactPhone}`}
              {r.whatsappNumber &&
                r.whatsappNumber !== r.contactPhone &&
                ` · WhatsApp ${r.whatsappNumber}`}
            </p>
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

          <AskReason
            label="Reject"
            prompt={`Why is the application from ${r.companyName} being rejected?`}
            placeholder="Explain what the applicant needs to fix. They will see this message."
            confirmLabel="Reject application"
            destructive
            suggestions={REJECT_SUGGESTIONS}
            onConfirm={async (reason) => {
              await rejectCompanyRegistration(r.id, reason);
              onChanged();
            }}
          />
        </div>
      </div>
    </li>
  );
}
