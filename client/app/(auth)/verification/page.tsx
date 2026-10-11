"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/types";
import { errorText, requestAgentVerification } from "@/lib/supabase/admin";
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
} from "@/lib/supabase/moderation";
import { Button } from "@/components/ui/Button";
import { PageSpinner } from "@/components/ui/Spinner";

const ID_STATUS: Record<string, string> = {
  pending: "Waiting for review",
  approved: "Approved",
  rejected: "Rejected",
  more_info: "More info needed",
};

export default function VerificationPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [docs, setDocs] = useState<MyIdentityDocument[] | null>(null);
  const [feedback, setFeedback] = useState<VerificationFeedback[]>([]);
  const [appeals, setAppeals] = useState<MyAppeal[]>([]);
  const [suspension, setSuspension] = useState<{ subjectType: string; subjectId: string; reason: string } | null>(null);
  const [docType, setDocType] = useState<IdDocType>("nin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

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
      })
      .catch(() => !cancelled && setError("Couldn't load your verification details."));
    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  if (isLoading || (user && !docs && !error)) return <PageSpinner label="Loading verification…" />;
  if (!user) return null;

  const reload = () => setTick((t) => t + 1);
  const isAgent = user.roles.includes(Role.Agent);
  const companyId = typeof user.companyId === "string" ? user.companyId : user.companyId?._id;
  const agentStatus = user.agentProfile?.verificationStatus ?? "unverified";
  const agentFeedback = feedback.find((f) => f.subjectType === "agent");
  const companyFeedback = feedback.find((f) => f.subjectType === "company");
  const hasUsableId = (docs ?? []).some((d) => d.status === "pending" || d.status === "approved");
  const hasOpenAppeal = (type: string, id: string) =>
    appeals.some((a) => a.subjectType === type && a.subjectId === id && a.status === "open");

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await uploadIdentityDocument(user._id, docType, file);
      setNotice("ID uploaded. Our team will review it.");
      reload();
    } catch (e) {
      setError(errorText(e, "Upload failed."));
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      await requestAgentVerification();
      await refreshUser();
      setNotice("Verification requested. We'll let you know once it's reviewed.");
    } catch (e) {
      setError(errorText(e, "Couldn't send your request."));
    } finally {
      setBusy(false);
    }
  };

  const appeal = async (type: "verification" | "identity_document" | "suspension", id: string) => {
    const message = window.prompt("Tell our team why this decision should be reviewed again (at least 10 characters):");
    if (!message) return;
    try {
      await submitAppeal(type, id, message);
      setNotice("Appeal sent. You'll see the reply here.");
      reload();
    } catch (e) {
      setError(errorText(e, "Couldn't send your appeal."));
    }
  };

  const appealProps = (type: "verification" | "identity_document" | "suspension", id: string, subject: string) => ({
    open: hasOpenAppeal(type, id),
    onAppeal: () => appeal(type, id),
    subject,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Verification</h1>
        <p className="text-sm text-muted-foreground">
          Verified accounts can submit listings for review. We check your government ID, and for companies, the CAC
          documents.
        </p>
      </div>

      {notice && <p className="text-sm text-foreground">{notice}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {suspension && (
        <section className="space-y-2 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Your account is suspended</p>
          <p className="text-muted-foreground">Reason: {suspension.reason}</p>
          <AppealButtons {...appealProps("suspension", suspension.subjectId, "Suspension")} />
        </section>
      )}

      {isAgent && (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground">Agent verification</h2>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
              {agentStatus === "unverified" && agentFeedback?.decision === "more_info" ? "More info needed" : agentStatus}
            </span>
          </div>
          {agentFeedback?.note && agentStatus !== "verified" && (
            <p className="text-sm text-muted-foreground">Note from our team: {agentFeedback.note}</p>
          )}
          {agentStatus === "rejected" && <AppealButtons {...appealProps("verification", user._id, "Verification decision")} />}

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Government ID</p>
            {(docs ?? []).length === 0 && <p className="text-sm text-muted-foreground">No ID uploaded yet.</p>}
            {(docs ?? []).map((d) => (
              <div key={d.id} className="space-y-1 rounded-xl border border-border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-foreground">{ID_DOC_LABEL[d.docType]}</span>
                  <span className="text-xs text-muted-foreground">{ID_STATUS[d.status]}</span>
                </div>
                {d.reviewNote && d.status !== "approved" && (
                  <p className="text-xs text-muted-foreground">Note: {d.reviewNote}</p>
                )}
                {d.status === "rejected" && <AppealButtons {...appealProps("identity_document", d.id, "ID document decision")} />}
              </div>
            ))}
            {!hasUsableId && !suspension && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as IdDocType)}
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  {(Object.keys(ID_DOC_LABEL) as IdDocType[]).map((k) => (
                    <option key={k} value={k}>
                      {ID_DOC_LABEL[k]}
                    </option>
                  ))}
                </select>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => upload(e.target.files?.[0])}
                />
                <Button size="sm" variant="outline" isLoading={busy} onClick={() => fileInput.current?.click()}>
                  Upload ID
                </Button>
                <span className="text-xs text-muted-foreground">Photo or PDF, up to 10 MB. Only our team can see it.</span>
              </div>
            )}
          </div>

          {(agentStatus === "unverified" || agentStatus === "rejected") && !suspension && (
            <Button size="sm" disabled={!hasUsableId || busy} isLoading={busy} onClick={request}>
              Request verification
            </Button>
          )}
        </section>
      )}

      {companyId && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
          <h2 className="font-semibold text-foreground">Company verification</h2>
          <p className="text-muted-foreground">
            We check your CAC certificate. You can see the status on your{" "}
            <Link href="/company/dashboard" className="text-primary hover:underline">
              company dashboard
            </Link>
            .
          </p>
          {companyFeedback?.note && <p className="text-muted-foreground">Note from our team: {companyFeedback.note}</p>}
          {companyFeedback?.decision === "reject" && (
            <AppealButtons {...appealProps("verification", companyId, "Company verification decision")} />
          )}
        </section>
      )}

      {!isAgent && !companyId && (
        <p className="text-sm text-muted-foreground">
          Become an agent or register a company to get verified.{" "}
          <Link href="/onboarding/become-an-agent" className="text-primary hover:underline">
            Get started
          </Link>
        </p>
      )}
    </div>
  );
}

function AppealButtons({ open, onAppeal, subject }: { open: boolean; onAppeal: () => void; subject: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {open ? (
        <span className="text-xs text-muted-foreground">Appeal sent — waiting for a reply.</span>
      ) : (
        <Button size="sm" variant="outline" onClick={onAppeal}>
          Appeal
        </Button>
      )}
      <Button size="sm" variant="ghost" href={`/support?subject=${encodeURIComponent(subject)}`}>
        Contact support
      </Button>
    </div>
  );
}
