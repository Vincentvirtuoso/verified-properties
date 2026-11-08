"use client";

import { useCallback, useEffect, useState } from "react";
import { FiAlertCircle } from "react-icons/fi";
import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, Field, Spinner } from "@affilhomes/shared/ui";

interface Blocker {
  code: string;
  message: string;
}

interface DeleteCompanyCardProps {
  companyId: string;
  companyName: string;
}

export function DeleteCompanyCard({
  companyId,
  companyName,
}: DeleteCompanyCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBlockers = useCallback(async () => {
    setLoading(true);
    const { data } = await createClient().rpc("my_company_closure_blockers", {
      p_company_id: companyId,
    });
    setBlockers((data as Blocker[] | null) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    if (open) loadBlockers();
  }, [open, loadBlockers]);

  const reset = () => {
    setOpen(false);
    setConfirmText("");
    setPassword("");
    setError(null);
  };

  const canSubmit =
    confirmText.trim().toLowerCase() === companyName.trim().toLowerCase() &&
    password.length > 0 &&
    !busy;

  const handleClose = async () => {
    setError(null);
    setBusy(true);
    try {
      const { error: fnError } = await createClient().functions.invoke(
        "close-company",
        { body: { password, companyId, companyName: confirmText.trim() } },
      );
      if (fnError) {
        let code: string | undefined;
        try {
          code = (await (fnError as any).context.json()).error;
        } catch {}
        if (code === "reauth_failed") setError("That password isn't right.");
        else if (code === "name_mismatch")
          setError("The company name doesn't match.");
        else if (code === "closure_blocked") await loadBlockers();
        else setError("Couldn't close the company. Please try again.");
        return;
      }
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Close company"
      className="space-y-4 rounded-2xl border border-rose-200 bg-rose-50/40 p-5 dark:border-rose-900/50 dark:bg-rose-900/5"
    >
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">Close company</h2>
        <p className="text-xs leading-relaxed text-muted">
          Closing removes your company&apos;s listings and team access right
          away, and your account goes back to a viewer account. This can&apos;t
          be undone. To come back, you&apos;d apply for a new partnership.
        </p>
      </div>

      {!open ? (
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={() => setOpen(true)}
        >
          Close company
        </Button>
      ) : loading ? (
        <Spinner variant="muted" />
      ) : blockers.length > 0 ? (
        <div
          role="note"
          className="flex items-start gap-3.5 rounded-xl border border-warning/30 bg-warning/5 p-4"
        >
          <FiAlertCircle
            aria-hidden="true"
            className="mt-0.5 h-5 w-5 shrink-0 text-warning"
          />
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              You can&apos;t close this company yet
            </h3>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted">
              {blockers.map((b) => (
                <li key={b.code}>{b.message}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-medium text-muted underline underline-offset-2 hover:text-foreground"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <Field
            label={`Type "${companyName}" to confirm`}
            name="close-company-confirmation"
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
            name="close-company-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore
            inputClassName="px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleClose}
              isLoading={busy}
              loadingText="Closing…"
              variant="danger"
              size="sm"
              disabled={!canSubmit}
            >
              Close company
            </Button>
            <button
              type="button"
              onClick={reset}
              disabled={busy}
              className="text-xs font-medium text-muted underline underline-offset-2 hover:text-foreground disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </section>
  );
}
