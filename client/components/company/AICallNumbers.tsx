"use client";

import { useCallback, useEffect, useState } from "react";
import { LuPhone } from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import { Button, Field as Input } from "@affilhomes/shared/ui";
import { PropertyOwnerType } from "@/types";

type NumberRow = {
  id: string;
  e164: string;
  status: "pending" | "active";
  is_default: boolean;
};

const STATUS_LABEL: Record<NumberRow["status"], string> = {
  pending: "Awaiting allocation",
  active: "Active",
};

export function AICallNumbers({
  ownerType,
  ownerId,
  canEdit,
}: {
  ownerType: PropertyOwnerType;
  ownerId: string;
  canEdit: boolean;
}) {
  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await createClient()
      .from("ai_call_numbers")
      .select("id, e164, status, is_default")
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .in("status", ["pending", "active"])
      .order("requested_at", { ascending: true });

    if (!error) setNumbers((data ?? []) as NumberRow[]);
    setLoading(false);
  }, [ownerType, ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!canEdit || !input.trim()) return;
    setBusy(true);
    setMessage(null);

    const res = await fetch("/api/ai-calling/numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerType,
        ownerId,
        number: input,
      }),
    });
    const body = await res.json().catch(() => ({}));

    setBusy(false);

    if (!res.ok) {
      setMessage({
        type: "error",
        text: body.error ?? "Couldn't add the number.",
      });
      return;
    }

    setInput("");
    setMessage({
      type: "ok",
      text: "Number requested. It goes live once it's allocated.",
    });
    load();
  };

  const release = async (id: string) => {
    if (
      !window.confirm(
        "Release this number? Billing continues until the termination date.",
      )
    ) {
      return;
    }

    const { error } = await createClient().rpc("release_ai_call_number", {
      p_id: id,
    });

    if (error) {
      setMessage({ type: "error", text: "Couldn't release the number." });
      return;
    }

    setMessage({ type: "ok", text: "Number released." });
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <LuPhone className="h-4 w-4 text-muted" />
        <h3 className="text-sm font-semibold text-foreground">Phone numbers</h3>
      </div>

      {loading ? (
        <p className="text-xs text-muted">Loading numbers…</p>
      ) : numbers.length === 0 ? (
        <p className="text-xs text-muted">No numbers yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-background">
          {numbers.map((n) => (
            <li
              key={n.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {n.e164}
                  {n.is_default && (
                    <span className="ml-2 text-xs text-muted">Default</span>
                  )}
                </p>
                <p className="text-xs text-muted">{STATUS_LABEL[n.status]}</p>
              </div>
              {canEdit && (
                <Button size="sm" variant="ghost" onClick={() => release(n.id)}>
                  Release
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Input
              label="Add a number"
              hint="Nigerian number, e.g. 0803 123 4567"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
            />
          </div>
          <Button
            size="sm"
            onClick={add}
            disabled={busy || !input.trim()}
            isLoading={busy}
          >
            Add
          </Button>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={
            message.type === "error"
              ? "text-xs text-destructive"
              : "text-xs text-muted"
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
