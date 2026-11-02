"use client";

import { useCallback, useEffect, useState } from "react";
import { LuArrowLeft, LuLoader } from "react-icons/lu";
import { FiAlertCircle } from "react-icons/fi";
import { format } from "@/utils";
import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, Field } from "@affilhomes/shared/ui";

interface Blocker {
  code: string;
  message: string;
}

const CONFIRM_PHRASE = "DELETE";

export function DeleteAccountPanel({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [pending, blk] = await Promise.all([
      createClient()
        .from("account_deletion_requests")
        .select("scheduled_for")
        .eq("status", "pending")
        .maybeSingle(),
      createClient().rpc("my_account_deletion_blockers"),
    ]);
    setScheduledFor(pending.data?.scheduled_for ?? null);
    setBlockers((blk.data as Blocker[] | null) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canSubmit =
    confirmText.trim().toUpperCase() === CONFIRM_PHRASE &&
    password.length > 0 &&
    !busy;

  const handleDelete = async () => {
    setError(null);
    setBusy(true);
    try {
      const { error: fnError } = await createClient().functions.invoke(
        "request-account-deletion",
        { body: { password } },
      );
      if (fnError) {
        let code: string | undefined;
        try {
          code = (await (fnError as any).context.json()).error;
        } catch {}
        if (code === "reauth_failed") {
          setError("That password isn't right.");
        } else if (code === "deletion_blocked") {
          await load();
        } else {
          setError("Couldn't start deletion. Please try again.");
        }
        return;
      }
      setPassword("");
      setConfirmText("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setBusy(true);
    const { error: rpcError } = await createClient().rpc(
      "cancel_account_deletion",
    );
    if (rpcError) setError("Couldn't cancel. Please try again.");
    else await load();
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LuArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
        Back to profile
      </button>

      <h2 className="text-xl font-bold text-foreground">Delete my account</h2>

      {loading ? (
        <LuLoader className="h-5 w-5 animate-spin text-muted motion-reduce:animate-none" />
      ) : scheduledFor ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-200">
            <p className="font-semibold">Deletion scheduled</p>
            <p className="mt-1 text-xs leading-relaxed">
              Your account will be permanently deleted on{" "}
              {format(new Date(scheduledFor), "do MMM yyyy")}. Until then you
              can cancel and keep everything as it is.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            disabled={busy}
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel deletion"}
          </button>
        </div>
      ) : blockers.length > 0 ? (
        <div
          role="note"
          className="flex items-start gap-3.5 rounded-xl border border-warning/30 bg-warning/5 p-4"
        >
          <FiAlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-warning"
          />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">
              You can&apos;t delete this account yet
            </h3>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
              {blockers.map((b) => (
                <li key={b.code}>{b.message}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="text-xs leading-relaxed text-muted">
            Your personal details will be removed and you&apos;ll lose access to
            this account. You have 30 days to change your mind before it&apos;s
            permanent.
          </p>
          <Field
            label={`Type ${CONFIRM_PHRASE} to confirm`}
            name="delete-confirmation"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            inputClassName="px-3 py-2 text-sm"
          />

          <Field
            label="Your password"
            type="password"
            name="confirm-account-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore
            inputClassName="px-3 py-2 text-sm"
          />

          <Button
            type="button"
            onClick={handleDelete}
            isLoading={busy}
            loadingText="Working…"
            variant="danger"
            size="sm"
            disabled={!canSubmit}
          >
            {busy ? "Working…" : "Delete my account"}
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </div>
  );
}
