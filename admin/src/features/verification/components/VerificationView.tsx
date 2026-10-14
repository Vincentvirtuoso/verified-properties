"use client";

import { useState } from "react";
import {
  documentLink,
  fetchIdentityDocuments,
  fetchVerificationQueue,
  reviewIdentityDocument,
  setVerification,
  type IdentityDocumentItem,
  type VerificationItem,
  type VerificationStatus,
} from "@affilhomes/shared/supabase/admin";
import { ID_DOC_LABEL, type IdDocType } from "@affilhomes/shared/supabase";
import { Empty, FilterChips, ReviewActions, StatusPill } from "../../../components/ui/ReviewActions";
import { useAdminList } from "../../../hooks/useAdminList";

const DOC_LABELS: Record<string, string> = {
  cacCertificateUrl: "CAC certificate",
  companyLogoUrl: "Logo",
};

export function VerificationView() {
  const [status, setStatus] = useState<VerificationStatus>("pending");
  const queue = useAdminList<VerificationItem>(
    () => fetchVerificationQueue(status),
    [status],
  );
  const ids = useAdminList<IdentityDocumentItem>(
    () => fetchIdentityDocuments(null),
    [],
  );

  const open = async (
    path: string,
    bucket: "company-documents" | "identity-documents",
  ) => {
    try {
      window.open(await documentLink(path, bucket), "_blank", "noopener");
    } catch {
      window.alert("Couldn't open that document.");
    }
  };

  const idsFor = (userId: string) =>
    (ids.rows ?? []).filter((d) => d.userId === userId);
  const looseIds = (ids.rows ?? []).filter(
    (d) =>
      d.status === "pending" &&
      !(queue.rows ?? []).some((q) => q.subjectId === d.userId),
  );

  return (
    <section className="space-y-4">
      <FilterChips<VerificationStatus>
        value={status}
        onChange={setStatus}
        options={[
          { value: "pending", label: "Pending" },
          { value: "unverified", label: "More info requested" },
          { value: "verified", label: "Verified" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
      {queue.error && (
        <p role="alert" className="text-sm text-destructive">
          {queue.error}
        </p>
      )}
      {!queue.rows ? (
        <p className="text-sm text-muted-foreground">Loadingâ€¦</p>
      ) : queue.rows.length === 0 ? (
        <Empty />
      ) : (
        <ul className="space-y-3">
          {queue.rows.map((item) => {
            const key = item.subjectType + item.subjectId;
            const docs = Object.entries(item.documents).filter(
              ([, v]) => typeof v === "string" && v,
            ) as [string, string][];
            const idDocs =
              item.subjectType === "agent" ? idsFor(item.subjectId) : [];
            return (
              <li
                key={key}
                className="space-y-3 rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {item.subjectType} Â· {item.detail?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[item.email, item.phone].filter(Boolean).join(" Â· ")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {item.subjectType === "company" && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {docs.length === 0 ? (
                      <span className="text-muted-foreground">
                        No CAC documents uploaded
                      </span>
                    ) : (
                      docs.map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => open(v, "company-documents")}
                          className="text-primary hover:underline"
                        >
                          {DOC_LABELS[k] ?? k}
                        </button>
                      ))
                    )}
                  </div>
                )}

                {item.subjectType === "agent" && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      Government ID
                    </p>
                    {idDocs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No ID uploaded yet.
                      </p>
                    ) : (
                      idDocs.map((d) => (
                        <IdDocRow
                          key={d.id}
                          doc={d}
                          onOpen={open}
                          onDone={ids.reload}
                        />
                      ))
                    )}
                  </div>
                )}

                {status === "pending" && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {item.subjectType === "agent" ? "Agent" : "Company"}{" "}
                      decision
                    </p>
                    <ReviewActions
                      onDecide={async (d, reason) => {
                        await setVerification(item, d, reason);
                        queue.reload();
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {status === "pending" && looseIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            ID cards waiting (no verification request yet)
          </p>
          {looseIds.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <p className="text-sm font-medium text-foreground">
                {d.userName}
              </p>
              <IdDocRow doc={d} onOpen={open} onDone={ids.reload} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function IdDocRow({
  doc,
  onOpen,
  onDone,
}: {
  doc: IdentityDocumentItem;
  onOpen: (path: string, bucket: "identity-documents") => void;
  onDone: () => void;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={() => onOpen(doc.filePath, "identity-documents")}
          className="font-medium text-primary hover:underline"
        >
          {ID_DOC_LABEL[doc.docType as IdDocType] ?? doc.docType}
        </button>
        <StatusPill>{doc.status.replace("_", " ")}</StatusPill>
        {doc.reviewNote && (
          <span className="text-xs text-muted-foreground">
            {doc.reviewNote}
          </span>
        )}
      </div>
      {doc.status === "pending" && (
        <ReviewActions
          onDecide={async (d, reason) => {
            await reviewIdentityDocument(doc.id, d, reason);
            onDone();
          }}
        />
      )}
    </div>
  );
}
