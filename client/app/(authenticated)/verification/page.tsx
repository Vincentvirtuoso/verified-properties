"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@affilhomes/shared/types";
import {
  errorText,
  requestAgentVerification,
} from "@affilhomes/shared/supabase/admin";
import {
  fetchMyAppeals,
  fetchMyIdentityDocuments,
  fetchMySuspension,
  fetchMyVerificationFeedback,
  ID_DOC_LABEL,
  submitAppeal,
  uploadIdentityDocument,
  type IdDocType,
  type MyAppeal,
  type MyIdentityDocument,
  type VerificationFeedback,
} from "@affilhomes/shared/supabase";
import { Button } from "@affilhomes/shared/ui/Button";
import { PageSpinner } from "@affilhomes/shared/ui/Spinner";
import FileUpload from "@affilhomes/shared/ui/FileUpload";
import Select from "@affilhomes/shared/ui/Select";
import { LuFileText, LuMessageSquare } from "react-icons/lu";
import { Textarea } from "@affilhomes/shared/ui";
import { cn } from "@/utils";

type Tone = "neutral" | "pending" | "success" | "danger";
type AppealType = "verification" | "identity_document" | "suspension";
type VerificationStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "more_info"
  | "unverified";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  danger: "bg-destructive/10 text-destructive",
};

const ID_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Waiting for review", tone: "pending" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  more_info: { label: "More info needed", tone: "pending" },
};

const AGENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  unverified: { label: "Not verified", tone: "neutral" },
  pending: { label: "Under review", tone: "pending" },
  verified: { label: "Verified", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  more_info: { label: "More info needed", tone: "pending" },
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export default function VerificationPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [docs, setDocs] = useState<MyIdentityDocument[] | null>(null);
  const [feedback, setFeedback] = useState<VerificationFeedback[]>([]);
  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [suspension, setSuspension] = useState<{
    subjectType: string;
    subjectId: string;
    reason: string;
  } | null>(null);
  const [docType, setDocType] = useState<IdDocType>("nin");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([
      fetchMyIdentityDocuments(),
      fetchMyVerificationFeedback().catch(() => []),
      fetchMyAppeals().catch(() => []),
      fetchMySuspension(),
    ])
      .then(([d, f, a, s]) => {
        if (cancelled) return;
        setDocs(d);
        setFeedback(f);
        setAppeals(a);
        setSuspension(s);
        setLoadError(null);
      })
      .catch(() => {
        if (!cancelled)
          setLoadError("We couldn't load your verification details.");
      });
    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  // Auto-dismiss success messages so they don't linger.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  if (isLoading || (user && !docs && !loadError))
    return <PageSpinner label="Loading verification..." />;
  if (!user) return null;

  const reload = () => setTick((t) => t + 1);
  const isAgent = user.roles.includes(Role.Agent);
  const companyId =
    typeof user.companyId === "string" ? user.companyId : user.companyId?._id;
  const agentStatus = user.agentProfile?.verificationStatus ?? "unverified";
  const agentStatusInfo = AGENT_STATUS[agentStatus] ?? {
    label: agentStatus,
    tone: "neutral" as Tone,
  };
  const agentFeedback = feedback.find((f) => f.subjectType === "agent");
  const companyFeedback = feedback.find((f) => f.subjectType === "company");
  const docList = docs ?? [];
  const hasUsableId = docList.some(
    (d) => d.status === "pending" || d.status === "approved",
  );
  const hasOpenAppeal = (type: string, id: string) =>
    appeals.some(
      (a) =>
        a.subjectType === type && a.subjectId === id && a.status === "open",
    );

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setActionError(null);
    try {
      await uploadIdentityDocument(user._id, docType, file);
      setNotice("ID uploaded. Our team will review it.");
      reload();
    } catch (e) {
      setActionError(errorText(e, "Upload failed. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const requestReview = async () => {
    setBusy(true);
    setActionError(null);
    try {
      await requestAgentVerification();
      await refreshUser();
      setNotice(
        "Verification requested. We'll let you know once it's reviewed.",
      );
    } catch (e) {
      setActionError(errorText(e, "Couldn't send your request."));
    } finally {
      setBusy(false);
    }
  };

  const appeal = async (type: AppealType, id: string, message: string) => {
    setBusy(true);
    setActionError(null);
    try {
      await submitAppeal(type, id, message);
      setNotice("Appeal sent. You'll see the reply here.");
      reload();
    } catch (e) {
      setActionError(errorText(e, "Couldn't send your appeal."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Verified accounts can submit listings for review. We check your
          government ID and, for companies, your CAC documents.
        </p>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground"
        >
          {notice}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {actionError}
        </div>
      )}
      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <Button size="sm" variant="outline" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {suspension && (
        <Card tone="danger" title="Your account is suspended">
          <p className="text-sm text-muted-foreground">
            Reason: {suspension.reason}
          </p>
          <AppealSection
            open={hasOpenAppeal("suspension", suspension.subjectId)}
            busy={busy}
            label="Suspension"
            onSubmit={(msg) => appeal("suspension", suspension.subjectId, msg)}
          />
        </Card>
      )}

      {isAgent && (
        <Card
          title="Agent verification"
          badge={
            <Badge tone={agentStatusInfo.tone}>{agentStatusInfo.label}</Badge>
          }
        >
          {agentFeedback?.note && agentStatus !== "verified" && (
            <NoteFromTeam note={agentFeedback.note} />
          )}

          {agentStatus === "pending" && (
            <>
              <p className="text-sm text-muted-foreground">
                Thanks for submitting. Review usually takes a few business days.
              </p>
              {(docs ?? []).length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {(docs ?? []).length} uploaded
                </span>
              )}
              {(docs ?? []).map((d) => {
                const statusMap: Record<string, VerificationStatus> = {
                  pending: "pending",
                  approved: "verified",
                  rejected: "rejected",
                  more_info: "more_info",
                };
                const docStatus = statusMap[d.status] ?? "unverified";
                return (
                  <div
                    key={d.id}
                    className="space-y-3 rounded-xl border border-border bg-background/50 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <LuFileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {ID_DOC_LABEL[d.docType]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ID_STATUS[d.status].label}
                          </p>
                        </div>
                      </div>
                      <Badge tone={docStatus as Tone}>{docStatus}</Badge>
                    </div>

                    {d.reviewNote && d.status !== "approved" && (
                      <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        <LuMessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{d.reviewNote}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {agentStatus === "verified" && (
            <p className="text-sm text-muted-foreground">
              Your account is verified. You can now submit listings.
            </p>
          )}

          {!suspension &&
            agentStatus !== "pending" &&
            agentStatus !== "verified" && (
              <IdSection
                docs={docList}
                hasUsableId={hasUsableId}
                docType={docType}
                onDocTypeChange={setDocType}
                onUpload={upload}
                busy={busy}
              />
            )}

          {!suspension &&
            (agentStatus === "unverified" || agentStatus === "rejected") && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  disabled={!hasUsableId || busy}
                  isLoading={busy}
                  onClick={requestReview}
                >
                  Request verification
                </Button>
                {!hasUsableId && (
                  <span className="text-xs text-muted-foreground">
                    Upload an ID first to request verification.
                  </span>
                )}
              </div>
            )}

          {agentStatus === "rejected" && (
            <AppealSection
              open={hasOpenAppeal("verification", user._id)}
              busy={busy}
              label="Verification decision"
              onSubmit={(msg) => appeal("verification", user._id, msg)}
            />
          )}
        </Card>
      )}

      {companyId && (
        <Card title="Company verification">
          <p className="text-sm text-muted-foreground">
            We check your CAC certificate. You can follow the status on your{" "}
            <Link
              href="/company/dashboard"
              className="text-primary hover:underline"
            >
              company dashboard
            </Link>
            .
          </p>
          {companyFeedback?.note && (
            <NoteFromTeam note={companyFeedback.note} />
          )}
          {companyFeedback?.decision === "reject" && (
            <AppealSection
              open={hasOpenAppeal("verification", companyId)}
              busy={busy}
              label="Company verification decision"
              onSubmit={(msg) => appeal("verification", companyId, msg)}
            />
          )}
        </Card>
      )}

      {!isAgent && !companyId && (
        <Card title="Get verified">
          <p className="text-sm text-muted-foreground">
            Become an agent or register a company to get verified.
          </p>
          <div>
            <Button size="sm" href="/onboarding/become-an-agent">
              Get started
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Card({
  title,
  badge,
  tone,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  tone?: "danger";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`space-y-4 rounded-2xl border p-5 ${
        tone === "danger"
          ? "border-destructive/40 bg-destructive/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          className={`font-semibold ${
            tone === "danger" ? "text-destructive" : "text-foreground"
          }`}
        >
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </section>
  );
}

function NoteFromTeam({ note }: { note: string }) {
  return (
    <div className="rounded-lg bg-muted px-3 py-2 text-sm">
      <p className="font-medium text-foreground">Note from our team</p>
      <p className="text-muted-foreground">{note}</p>
    </div>
  );
}

function IdSection({
  docs,
  hasUsableId,
  docType,
  onDocTypeChange,
  onUpload,
  busy,
}: {
  docs: MyIdentityDocument[];
  hasUsableId: boolean;
  docType: IdDocType;
  onDocTypeChange: (t: IdDocType) => void;
  onUpload: (file: File | undefined) => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-4">
      {docs.length > 0 && (
        <ul className="divide-y divide-border rounded-xl border border-border text-sm">
          {docs.map((d) => {
            const info = ID_STATUS[d.status] ?? {
              label: d.status,
              tone: "neutral" as Tone,
            };
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-foreground">
                  {ID_DOC_LABEL[d.docType as IdDocType] ?? "ID document"}
                </span>
                <Badge tone={info.tone}>{info.label}</Badge>
              </li>
            );
          })}
        </ul>
      )}

      {!hasUsableId && (
        <div className="space-y-3">
          <Select
            label="Document type"
            value={docType}
            onChange={(value) => onDocTypeChange(value as IdDocType)}
            options={(Object.keys(ID_DOC_LABEL) as IdDocType[]).map((k) => ({
              label: ID_DOC_LABEL[k],
              value: k,
            }))}
          />
          <FileUpload
            variant="document"
            maxFiles={1}
            maxSizeInMB={10}
            accept="image/*,application/pdf"
            allowedTypes={["image/*", "application/pdf"]}
            label={busy ? "Uploading..." : "Upload your ID"}
            description="Photo or PDF, up to 10 MB. Only our team can see it."
            onUploadComplete={(files) => {
              void onUpload(files[0]);
            }}
          />
        </div>
      )}
    </div>
  );
}

function AppealSection({
  open,
  busy,
  label,
  onSubmit,
}: {
  open: boolean;
  busy: boolean;
  label: string;
  onSubmit: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      {open ? (
        <p className="text-sm text-muted-foreground">
          Your appeal is with our team. We'll reply here.
        </p>
      ) : editing ? (
        <AppealForm
          label={label}
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={(msg) => {
            onSubmit(msg);
            setEditing(false);
          }}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Appeal this decision
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Need more help?{" "}
        <Link
          href={`/support?subject=${encodeURIComponent(label)}`}
          className="text-primary hover:underline"
        >
          Contact support
        </Link>
      </p>
    </div>
  );
}

function AppealForm({
  label,
  busy,
  onCancel,
  onSubmit,
}: {
  label: string;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (message: string) => void;
}) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = text.trim();
  const valid = trimmed.length >= 10;
  const showError = touched && trimmed.length > 0 && !valid;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (valid && !busy) onSubmit(trimmed);
      }}
      className="space-y-2"
    >
      <Textarea
        rows={3}
        maxRows={6}
        maxLength={1000}
        value={text}
        onChange={setText}
        onBlur={() => setTouched(true)}
        label="Why should this be reviewed again?"
        placeholder={`Explain what was incorrect or missing in the ${label.toLowerCase()} decision.`}
        description={
          showError
            ? undefined
            : "Give our team some context — at least 10 characters."
        }
        error={showError ? "Please write at least 10 characters." : undefined}
      />

      <div className="flex items-center justify-end gap-3">

        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!valid || busy}
            isLoading={busy}
          >
            Send appeal
          </Button>
        </div>
      </div>
    </form>
  );
}
