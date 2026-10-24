"use client";

import { useEffect, useState } from "react";
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
import FileUpload from "@affilhomes/shared/ui/FileUpload";
import Select from "@affilhomes/shared/ui/Select";
import { LuFileText, LuMessageSquare, LuShieldAlert } from "react-icons/lu";
import { Skeleton, Textarea } from "@affilhomes/shared/ui";

type Tone = "neutral" | "pending" | "success" | "danger";
type AppealType = "verification" | "identity_document" | "suspension";
type IdentityStatus =
  | "verified"
  | "pending"
  | "rejected"
  | "more_info"
  | "unverified";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted/30 text-muted",
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

const IDENTITY_STATUS_LABEL: Record<
  IdentityStatus,
  { label: string; tone: Tone }
> = {
  verified: { label: "Verified", tone: "success" },
  pending: { label: "Under review", tone: "pending" },
  rejected: { label: "Rejected", tone: "danger" },
  more_info: { label: "More info needed", tone: "pending" },
  unverified: { label: "Not verified", tone: "neutral" },
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

function deriveIdentityStatus(docs: MyIdentityDocument[]): IdentityStatus {
  if (docs.some((d) => d.status === "approved")) return "verified";
  if (docs.some((d) => d.status === "pending")) return "pending";
  if (docs.some((d) => d.status === "more_info")) return "more_info";
  if (docs.some((d) => d.status === "rejected")) return "rejected";
  return "unverified";
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

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  if (isLoading || (user && !docs && !loadError))
    return <VerificationSkeleton />;
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

  // Identity verification state
  const identityStatus = deriveIdentityStatus(docList);
  const identityStatusInfo = IDENTITY_STATUS_LABEL[identityStatus];
  const hasApprovedId = docList.some((d) => d.status === "approved");
  // "usable" = shows in the list, and suppresses the upload form. Pending IDs
  // are usable for display, but NOT sufficient to request agent verification.
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

  const showPrereq =
    agentStatus !== "pending" && agentStatus !== "verified" && !hasApprovedId;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="text-sm text-muted">
          Verified accounts can submit listings for review. Verification happens
          in two stages: first we confirm{" "}
          <span className="font-medium text-foreground">who you are</span>{" "}
          (government ID), then we confirm{" "}
          <span className="font-medium text-foreground">
            you can list properties
          </span>{" "}
          (agent verification).
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
          <p className="text-sm text-muted">Reason: {suspension.reason}</p>
          <AppealSection
            open={hasOpenAppeal("suspension", suspension.subjectId)}
            busy={busy}
            label="Suspension"
            onSubmit={(msg) => appeal("suspension", suspension.subjectId, msg)}
          />
        </Card>
      )}

      {isAgent && (
        <>
          {/* Step 1 — identity */}
          <Card
            title="Identity verification"
            badge={
              <Badge tone={identityStatusInfo.tone}>
                {identityStatusInfo.label}
              </Badge>
            }
          >
            <p className="text-sm text-muted">
              Confirms who you are. Upload a government-issued ID such as a NIN,
              passport, or driver&apos;s license. Only our team can see it.
            </p>

            {identityStatus === "verified" && (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Your government ID is approved. You can proceed to agent
                verification.
              </p>
            )}

            <IdSection
              docs={docList}
              hasUsableId={hasUsableId}
              docType={docType}
              onDocTypeChange={setDocType}
              onUpload={upload}
              busy={busy}
            />
          </Card>

          {/* Step 2 — agent */}
          <Card
            title="Agent verification"
            badge={
              <Badge tone={agentStatusInfo.tone}>{agentStatusInfo.label}</Badge>
            }
          >
            <p className="text-sm text-muted">
              Confirms you&apos;re approved to act as an agent on AffilHomes and
              submit property listings. Requires an approved government ID from
              step 1.
            </p>

            {agentFeedback?.note && agentStatus !== "verified" && (
              <NoteFromTeam note={agentFeedback.note} />
            )}

            {agentStatus === "pending" && (
              <p className="text-sm text-muted">
                Thanks for submitting. Review usually takes a few business days.
              </p>
            )}

            {agentStatus === "verified" && (
              <p className="text-sm text-muted">
                You&apos;re verified as an agent. You can now submit listings.
              </p>
            )}

            {showPrereq && <PrereqNotice identityStatus={identityStatus} />}

            {!suspension &&
              (agentStatus === "unverified" || agentStatus === "rejected") && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    disabled={!hasApprovedId || busy}
                    isLoading={busy}
                    onClick={requestReview}
                  >
                    Request agent verification
                  </Button>
                  {!hasApprovedId && (
                    <span className="text-xs text-muted">
                      {identityStatus === "pending"
                        ? "Your ID is under review — you can request once it's approved."
                        : identityStatus === "rejected"
                          ? "Re-upload a valid ID to continue."
                          : "Get your government ID approved first."}
                    </span>
                  )}
                </div>
              )}

            {agentStatus === "rejected" && (
              <AppealSection
                open={hasOpenAppeal("verification", user._id)}
                busy={busy}
                label="Agent verification decision"
                onSubmit={(msg) => appeal("verification", user._id, msg)}
              />
            )}
          </Card>
        </>
      )}

      {companyId && (
        <Card title="Company verification">
          <p className="text-sm text-muted">
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
          <p className="text-sm text-muted">
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
    <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
      <p className="font-medium text-foreground">Note from our team</p>
      <p className="text-muted">{note}</p>
    </div>
  );
}

function PrereqNotice({ identityStatus }: { identityStatus: IdentityStatus }) {
  const message =
    identityStatus === "pending"
      ? "Your government ID is under review. Once it's approved you can request agent verification."
      : identityStatus === "rejected"
        ? "Your government ID was rejected. Re-upload a valid ID in the Identity verification card above to continue."
        : identityStatus === "more_info"
          ? "We need a bit more info about your government ID. Check the Identity verification card above."
          : "Upload and get your government ID approved in the Identity verification card above before requesting agent verification.";

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3.5 py-3 text-sm">
      <LuShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="space-y-0.5">
        <p className="font-medium text-foreground">
          Approved government ID required
        </p>
        <p className="text-muted">{message}</p>
      </div>
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
              <li key={d.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-foreground">
                    <LuFileText className="h-3.5 w-3.5 text-muted" />
                    {ID_DOC_LABEL[d.docType as IdDocType] ?? "ID document"}
                  </span>
                  <Badge tone={info.tone}>{info.label}</Badge>
                </div>
                {d.reviewNote && d.status !== "approved" && (
                  <div className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted">
                    <LuMessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{d.reviewNote}</span>
                  </div>
                )}
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
            label={busy ? "Uploading..." : "Upload your government ID"}
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
        <p className="text-sm text-muted">
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
      <p className="text-xs text-muted">
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

function VerificationSkeleton() {
  return (
    <div
      className="mx-auto max-w-2xl space-y-6 px-4 py-10"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading verification…</span>

      <header className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-3/4 max-w-sm" />
      </header>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <ul className="divide-y divide-border rounded-xl border border-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </li>
          ))}
        </ul>

        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-xl" />

        <Skeleton className="h-9 w-48 rounded-md" />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </section>
    </div>
  );
}
