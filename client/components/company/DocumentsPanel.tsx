"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuCheck,
  LuFileText,
  LuImage,
  LuTrash2,
  LuUpload,
  LuX,
} from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, Spinner } from "@affilhomes/shared/ui";
import { cn } from "@/lib/utils";

type DocStatus =
  | "uploaded"
  | "extracting"
  | "pending_review"
  | "approved"
  | "rejected"
  | "failed"
  | "asset";

type DocRow = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  status: DocStatus;
  rejection_reason: string | null;
  created_at: string;
};

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const STATUS: Record<DocStatus, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "bg-muted/30 text-muted" },
  extracting: { label: "Reading…", className: "bg-info/10 text-info" },
  pending_review: {
    label: "Awaiting review",
    className: "bg-warning/10 text-warning",
  },
  approved: { label: "In use", className: "bg-success/10 text-success" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
  },
  failed: {
    label: "Couldn't read",
    className: "bg-destructive/10 text-destructive",
  },
  asset: { label: "Stored only", className: "bg-muted/30 text-muted" },
};

const MB = 1024 * 1024;

export function DocumentsPanel({
  companyId,
  userId,
  canEdit,
  quotaMb,
  perFileMb,
}: {
  companyId: string;
  userId: string;
  canEdit: boolean;
  quotaMb: number;
  perFileMb: number;
}) {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const usedBytes = docs.reduce((sum, d) => sum + d.size_bytes, 0);
  const usedPct = Math.min(100, (usedBytes / (quotaMb * MB)) * 100);

  const refresh = useCallback(async () => {
    const { data, error } = await createClient()
      .from("ai_documents")
      .select(
        "id, file_name, mime_type, size_bytes, storage_path, status, rejection_reason, created_at",
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      setError("Couldn't load documents.");
      return;
    }
    setDocs((data as DocRow[]) ?? []);
  }, [companyId]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const upload = async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Upload a PDF, Word (.docx), PNG or JPEG file.");
      return;
    }
    if (file.size > perFileMb * MB) {
      setError(`Each file can be up to ${perFileMb}MB.`);
      return;
    }
    if (usedBytes + file.size > quotaMb * MB) {
      setError(`This file would go over your ${quotaMb}MB limit.`);
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();

      // The edge function checks Pro, admin role, type, size, and quota,
      // then creates the row and returns a signed upload target.
      const { data, error: fnError } = await supabase.functions.invoke(
        "documents-upload-url",
        {
          body: {
            companyId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        },
      );
      if (fnError || !data?.path || !data?.token) {
        throw new Error(fnError?.message ?? "Couldn't start the upload.");
      }

      const { error: uploadError } = await supabase.storage
        .from("company-training-documents")
        .uploadToSignedUrl(data.path, data.token, file, {
          contentType: file.type,
        });
      if (uploadError) throw uploadError;

      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const approve = async (doc: DocRow) => {
    setBusyId(doc.id);
    const { error } = await createClient()
      .from("ai_documents")
      .update({
        status: "approved",
        rejection_reason: null,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
    setBusyId(null);
    if (error) return setError("Couldn't approve that document.");
    await refresh();
  };

  const reject = async (doc: DocRow) => {
    const reason = rejectReason.trim();
    if (!reason)
      return setError("Add a reason so the uploader knows what to fix.");

    setBusyId(doc.id);
    const { error } = await createClient()
      .from("ai_documents")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", doc.id);
    setBusyId(null);
    if (error) return setError("Couldn't reject that document.");
    setRejectingId(null);
    setRejectReason("");
    await refresh();
  };

  const remove = async (doc: DocRow) => {
    if (
      !window.confirm(
        `Delete ${doc.file_name}? The assistant will stop using it.`,
      )
    ) {
      return;
    }
    setBusyId(doc.id);
    const supabase = createClient();

    // Remove the file first, so a failed row delete never leaves an orphaned file
    const { error: storageError } = await supabase.storage
      .from("company-training-documents")
      .remove([doc.storage_path]);
    if (storageError) {
      setBusyId(null);
      return setError("Couldn't delete the file. Try again.");
    }

    const { error } = await supabase
      .from("ai_documents")
      .delete()
      .eq("id", doc.id);
    setBusyId(null);
    if (error) return setError("Couldn't remove that document.");
    await refresh();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LuFileText className="h-4 w-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-foreground">
                Documents
              </h2>
              <p className="text-xs text-muted">
                Manage your company's knowledge base
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Upload price sheets, brochures, terms and other company documents.
            Approved readable documents can be used by your AI assistant when
            responding to enquiries.
          </p>
        </div>

        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              className="sr-only"
              id="document-upload"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />

            <Button
              size="sm"
              disabled={uploading}
              isLoading={uploading}
              onClick={() => inputRef.current?.click()}
              leftIcon={<LuUpload className="h-4 w-4" />}
              className="shrink-0"
            >
              {uploading ? "Uploading..." : "Upload document"}
            </Button>
          </>
        )}
      </div>

      <div className="space-y-5 p-5">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Storage usage
              </p>
              <p className="mt-1 text-xs text-muted">
                Space available for company documents
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {(usedBytes / MB).toFixed(1)}
                <span className="ml-1 text-sm font-normal text-muted">
                  / {quotaMb} MB
                </span>
              </p>
              <p className="text-xs text-muted">
                {Math.max(0, quotaMb - usedBytes / MB).toFixed(1)} MB remaining
              </p>
            </div>
          </div>

          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-muted/20"
            role="progressbar"
            aria-label="Document storage usage"
            aria-valuenow={Math.round(usedPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                usedPct >= 90
                  ? "bg-warning"
                  : usedPct >= 70
                    ? "bg-primary/70"
                    : "bg-primary",
              )}
              style={{ width: `${usedPct}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted">
            <span>{docs.length} documents stored</span>
            <span className={usedPct >= 90 ? "text-warning" : ""}>
              {usedPct.toFixed(0)}% used
            </span>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "group flex w-full items-center gap-4 rounded-xl border border-dashed border-border bg-background p-4 text-left transition-colors",
              "hover:border-primary/50 hover:bg-primary/3",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              uploading && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
              {uploading ? <Spinner /> : <LuUpload className="h-5 w-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {uploading ? "Uploading document..." : "Add a new document"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                PDF, DOCX, PNG or JPEG · Up to {perFileMb} MB per file
              </p>
            </div>

            <span className="hidden text-xs font-medium text-primary sm:block">
              Browse files
            </span>
          </button>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3"
          >
            <LuX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

            <p className="min-w-0 flex-1 text-sm text-destructive">{error}</p>

            <button
              type="button"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
              className="shrink-0 rounded-md p-1 text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Uploaded documents
            </h3>
            <p className="mt-1 text-xs text-muted">
              Documents and their processing status
            </p>
          </div>

          <span className="rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted">
            {docs.length} total
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border py-12">
            <Spinner />
            <p className="text-sm text-muted">Loading your documents...</p>
          </div>
        ) : docs.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background px-5 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/30 text-muted">
              <LuFileText className="h-6 w-6" />
            </div>

            <h4 className="mt-4 text-sm font-semibold text-foreground">
              No documents yet
            </h4>

            <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
              Your company documents will appear here once uploaded. Add your
              first document to get started.
            </p>

            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="mt-5"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                leftIcon={<LuUpload className="h-4 w-4" />}
              >
                Upload your first document
              </Button>
            )}
          </div>
        ) : (
          /* Documents */
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {docs.map((doc) => {
              const status = STATUS[doc.status];
              const Icon = doc.mime_type.startsWith("image/")
                ? LuImage
                : LuFileText;
              const busy = busyId === doc.id;

              return (
                <article
                  key={doc.id}
                  className="group p-4 transition-colors hover:bg-muted/12"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium text-foreground"
                          title={doc.file_name}
                        >
                          {doc.file_name}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                          <span>{(doc.size_bytes / MB).toFixed(1)} MB</span>
                          <span className="text-border">·</span>
                          <span>
                            {new Date(doc.created_at).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                          status.className,
                        )}
                      >
                        {status.label}
                      </span>

                      <div className="flex items-center gap-1">
                        {canEdit && doc.status === "pending_review" && (
                          <>
                            <button
                              type="button"
                              aria-label={`Approve ${doc.file_name}`}
                              title="Approve document"
                              disabled={busy}
                              onClick={() => void approve(doc)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-success transition-colors hover:bg-success/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {busy ? (
                                <Spinner />
                              ) : (
                                <LuCheck className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              type="button"
                              aria-label={`Reject ${doc.file_name}`}
                              title="Reject document"
                              disabled={busy}
                              onClick={() => {
                                setRejectingId(doc.id);
                                setRejectReason("");
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                            >
                              <LuX className="h-4 w-4" />
                            </button>
                          </>
                        )}

                        {canEdit && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${doc.file_name}`}
                            title="Delete document"
                            disabled={busy}
                            onClick={() => void remove(doc)}
                            isLoading={busy}
                            className="h-8 w-8 shrink-0 rounded-lg text-muted hover:bg-destructive/10 hover:text-destructive"
                          >
                            <LuTrash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {doc.status === "rejected" && doc.rejection_reason && (
                    <div className="mt-3 flex gap-2 rounded-lg bg-destructive/5 p-3 sm:ml-14">
                      <LuX className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-destructive">
                          Rejection reason
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {doc.rejection_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {rejectingId === doc.id && (
                    <div className="mt-3 space-y-3 rounded-xl border border-border bg-background p-3 sm:ml-14">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Reject this document
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          Explain what needs to be corrected before it can be
                          approved.
                        </p>
                      </div>

                      <textarea
                        value={rejectReason}
                        onChange={(e) =>
                          setRejectReason(e.target.value.slice(0, 200))
                        }
                        placeholder="Enter a reason for rejection..."
                        rows={2}
                        maxLength={200}
                        className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-muted">
                          {rejectReason.length}/200 characters
                        </span>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            size="sm"
                            disabled={busy || !rejectReason.trim()}
                            isLoading={busy}
                            onClick={() => void reject(doc)}
                          >
                            Reject document
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!canEdit && (
          <p className="text-xs leading-relaxed text-muted">
            You can view company documents, but only company admins can upload,
            approve or delete them.
          </p>
        )}
      </div>
    </section>
  );
}
