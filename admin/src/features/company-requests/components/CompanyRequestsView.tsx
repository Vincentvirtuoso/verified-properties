"use client";

import { LuRefreshCw } from "react-icons/lu";
import { Alert } from "@affilhomes/shared/ui/Alert";
import { Empty, ReloadButton } from "@/components/ui/ReviewActions";
import { useCompanyRequests } from "../hooks/useCompanyRequests";
import { CompanyRequestCard } from "./CompanyRequestCard";

export function CompanyRequestsView() {
  const { rows, error, reload, openDocument, documentError, loading } =
    useCompanyRequests();

  return (
    <section className="space-y-4" aria-label="Company requests">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Partnership requests
          </h1>
          <p className="text-xs text-muted">
            Oldest first. Approving makes the applicant&apos;s account a company
            account.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          {rows && (
            <span className="tabular-nums">{rows.length} awaiting review</span>
          )}
          <ReloadButton reload={reload} loading={loading} />
        </div>
      </div>

      {error && <Alert onRetry={reload}>{error}</Alert>}
      {documentError && <Alert>{documentError}</Alert>}

      {!rows && !error && (
        <ul
          aria-label="Loading requests"
          aria-busy="true"
          className="space-y-3"
        >
          {[0, 1].map((i) => (
            <li
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-border bg-card"
            />
          ))}
        </ul>
      )}

      {rows && rows.length === 0 && (
        <Empty
          title="No requests waiting"
          message="Partnership applications appear here once an applicant submits their CAC certificate."
        />
      )}

      {rows && rows.length > 0 && (
        <ul className="space-y-3">
          {rows.map((request) => (
            <CompanyRequestCard
              key={request.id}
              request={request}
              onChanged={reload}
              onViewDocument={openDocument}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
