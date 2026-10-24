"use client";

import { useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import { LuCircleAlert, LuExternalLink, LuFileText } from "react-icons/lu";
import {
  documentLink,
  type ReviewStatus,
} from "@affilhomes/shared/supabase/admin";

export type DocBucket =
  | "company-documents"
  | "identity-documents"
  | "property-documents";

/**
 * Opens a private document in a new tab.
 * Don't pass "noopener" to window.open: it makes the call return null,
 * which looks like a pop-up block. Clear the opener on the returned window instead.
 */
export function useOpenDocument(bucket: DocBucket) {
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const open = async (path: string) => {
    setError(null);
    setOpeningPath(path);
    const win = window.open("about:blank", "_blank");
    if (!win) {
      setError(
        "Your browser blocked the document. Allow pop-ups for this site and try again.",
      );
      setOpeningPath(null);
      return;
    }
    win.opener = null;
    try {
      win.location.href = await documentLink(path, bucket);
    } catch {
      win.close();
      setError("Couldn't open that document. Try again in a moment.");
    } finally {
      setOpeningPath(null);
    }
  };

  return { openingPath, error, clearError: () => setError(null), open };
}

export function DocButton({
  label,
  busy,
  onClick,
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {busy ? (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        <LuFileText
          size={14}
          aria-hidden="true"
          className="text-muted-foreground"
        />
      )}
      {busy ? "Opening…" : label}
      {!busy && (
        <LuExternalLink
          size={12}
          aria-hidden="true"
          className="text-muted-foreground"
        />
      )}
    </button>
  );
}



export type { ReviewStatus };
