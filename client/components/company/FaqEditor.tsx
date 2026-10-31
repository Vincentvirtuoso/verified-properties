"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowDown,
  LuArrowUp,
  LuCheck,
  LuPlus,
  LuTrash2,
} from "react-icons/lu";

import { createClient } from "@affilhomes/shared/supabase/client";
import {
  Button,
  Checkbox,
  Field,
  Spinner,
  Textarea,
} from "@affilhomes/shared/ui";
import { FAQ_LIMIT } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

type Faq = {
  id: string;
  question: string;
  answer: string;
  position: number;
  enabled: boolean;
};

type Patch = Partial<Pick<Faq, "question" | "answer" | "enabled" | "position">>;

const Q_MAX = 200;
const A_MAX = 1000;
const DEFAULT_QUESTION = "New question";
const SAVED_FLASH_MS = 1500;

export function FaqEditor({
  companyId,
  canEdit,
}: {
  companyId: string;
  canEdit: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedId, setSavedId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newId, setNewId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Last saved text per FAQ. Used to skip requests when nothing changed.
  const saved = useRef<Record<string, { question: string; answer: string }>>(
    {},
  );
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("ai_faqs")
      .select("id, question, answer, position, enabled")
      .eq("company_id", companyId)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError("Couldn't load FAQs. Refresh the page to try again.");
        } else {
          const rows = (data as Faq[]) ?? [];
          rows.forEach((f) => {
            saved.current[f.id] = { question: f.question, answer: f.answer };
          });
          setFaqs(rows);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, companyId]);

  useEffect(() => {
    return () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, []);

  const patchLocal = (id: string, patch: Patch) =>
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const setSaving = (id: string, on: boolean) =>
    setSavingIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const setRowError = (id: string, message: string | null) =>
    setRowErrors((prev) => {
      const next = { ...prev };
      if (message) next[id] = message;
      else delete next[id];
      return next;
    });

  const save = async (id: string, patch: Patch): Promise<boolean> => {
    setSaving(id, true);
    setRowError(id, null);

    const { error } = await supabase
      .from("ai_faqs")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);

    setSaving(id, false);

    if (error) {
      setRowError(
        id,
        "Couldn't save this change. Your edit is still here. Click away from the field again to retry.",
      );
      return false;
    }

    const current = saved.current[id] ?? { question: "", answer: "" };
    saved.current[id] = {
      question: patch.question ?? current.question,
      answer: patch.answer ?? current.answer,
    };

    setSavedId(id);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedId(null), SAVED_FLASH_MS);
    return true;
  };

  const commitQuestion = (faq: Faq, raw: string) => {
    const question = raw.trim();
    // Empty questions aren't saved. The field shows an inline message instead.
    if (!question) return;
    if (question === saved.current[faq.id]?.question) return;

    patchLocal(faq.id, { question });
    void save(faq.id, { question });
  };

  const commitAnswer = (faq: Faq, raw: string) => {
    const answer = raw.trim();
    if (answer === saved.current[faq.id]?.answer) return;

    // A FAQ without an answer can't stay live, so clearing it switches it off too
    const patch: Patch = answer ? { answer } : { answer, enabled: false };

    patchLocal(faq.id, patch);
    void save(faq.id, patch);
  };

  const toggleEnabled = async (faq: Faq, enabled: boolean) => {
    if (enabled && !faq.answer.trim()) return;

    patchLocal(faq.id, { enabled });
    const ok = await save(faq.id, { enabled });
    if (!ok) patchLocal(faq.id, { enabled: faq.enabled });
  };

  const add = async () => {
    if (faqs.length >= FAQ_LIMIT || adding) return;
    setAdding(true);
    setRowError("new", null);

    const { data, error } = await supabase
      .from("ai_faqs")
      .insert({
        company_id: companyId,
        question: DEFAULT_QUESTION,
        answer: "",
        position: faqs.length,
        enabled: false,
      })
      .select("id, question, answer, position, enabled")
      .single();

    setAdding(false);

    if (error || !data) {
      setLoadError("Couldn't add a FAQ. Try again.");
      return;
    }

    const row = data as Faq;
    saved.current[row.id] = { question: row.question, answer: row.answer };
    setFaqs((prev) => [...prev, row]);
    setNewId(row.id); // the new question field focuses itself
  };

  const remove = async (id: string) => {
    setConfirmDeleteId(null);
    setSaving(id, true);

    const { error } = await supabase.from("ai_faqs").delete().eq("id", id);

    setSaving(id, false);

    if (error) {
      setRowError(id, "Couldn't delete this FAQ. Try again.");
      return;
    }

    delete saved.current[id];
    setFaqs((prev) => prev.filter((f) => f.id !== id));
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= faqs.length) return;

    const a = faqs[index];
    const b = faqs[target];

    setSaving(a.id, true);
    setSaving(b.id, true);

    const [ra, rb] = await Promise.all([
      supabase.from("ai_faqs").update({ position: b.position }).eq("id", a.id),
      supabase.from("ai_faqs").update({ position: a.position }).eq("id", b.id),
    ]);

    setSaving(a.id, false);
    setSaving(b.id, false);

    if (ra.error || rb.error) {
      setRowError(a.id, "Couldn't reorder FAQs. Try again.");
      return;
    }

    setFaqs((prev) => {
      const next = [...prev];
      next[index] = { ...b, position: a.position };
      next[target] = { ...a, position: b.position };
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-5 text-sm text-muted">
        <Spinner variant="muted" />
        Loading FAQs…
      </div>
    );
  }

  const atLimit = faqs.length >= FAQ_LIMIT;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">FAQs</h2>
          <p className="mt-1 text-sm text-muted">
            Common questions and answers. Live FAQs appear on your company page
            and are used by the assistant.
          </p>
          <p className="mt-1 text-xs text-muted">
            Changes save when you click away from a field.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted">
          {faqs.length} of {FAQ_LIMIT}
        </span>
      </div>

      {loadError && (
        <p role="alert" className="mb-4 text-xs text-destructive">
          {loadError}
        </p>
      )}

      {faqs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="text-sm font-medium text-foreground">No FAQs yet</p>
          <p className="max-w-sm text-sm text-muted">
            Add the questions buyers ask most, like payment terms, viewing
            times, or documents needed.
          </p>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={add}
              disabled={adding}
              leftIcon={<LuPlus className="h-4 w-4" />}
            >
              Add your first FAQ
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {faqs.map((faq, i) => {
            const status = statusOf(faq);
            const isSaving = savingIds.has(faq.id);
            const hasAnswer = faq.answer.trim().length > 0;
            const questionEmpty = canEdit && faq.question.trim().length === 0;

            return (
              <li
                key={faq.id}
                className="rounded-xl border border-border bg-background p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted">
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        status.className,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <SaveIndicator
                      saving={isSaving}
                      saved={savedId === faq.id}
                    />

                    {canEdit && (
                      <div className="flex items-center gap-0.5">
                        <IconButton
                          label="Move up"
                          disabled={i === 0 || isSaving}
                          onClick={() => move(i, -1)}
                        >
                          <LuArrowUp className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          label="Move down"
                          disabled={i === faqs.length - 1 || isSaving}
                          onClick={() => move(i, 1)}
                        >
                          <LuArrowDown className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton
                          label="Delete FAQ"
                          disabled={isSaving}
                          onClick={() => setConfirmDeleteId(faq.id)}
                        >
                          <LuTrash2 className="h-3.5 w-3.5 text-destructive" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </div>

                <Field
                  label="Question"
                  required
                  value={faq.question}
                  maxLength={Q_MAX}
                  disabled={!canEdit}
                  autoFocus={newId === faq.id}
                  error={
                    questionEmpty
                      ? "Add a question before leaving this field."
                      : undefined
                  }
                  onChange={(e) =>
                    patchLocal(faq.id, { question: e.target.value })
                  }
                  onBlur={(e) => commitQuestion(faq, e.target.value)}
                />

                <div className="mt-4">
                  <Textarea
                    label="Answer"
                    value={faq.answer}
                    rows={3}
                    maxLength={A_MAX}
                    disabled={!canEdit}
                    placeholder="Write the answer buyers should see"
                    description={
                      hasAnswer
                        ? undefined
                        : "Add an answer before you can turn this FAQ on."
                    }
                    onChange={(value) => patchLocal(faq.id, { answer: value })}
                    onBlur={(e) => commitAnswer(faq, e.target.value)}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <Checkbox
                    checked={faq.enabled}
                    disabled={!canEdit || !hasAnswer || isSaving}
                    onChange={(e) => toggleEnabled(faq, e.target.checked)}
                    label={
                      hasAnswer
                        ? "Show on company page and to the assistant"
                        : "Off until an answer is added"
                    }
                  />
                </div>

                {rowErrors[faq.id] && (
                  <p role="alert" className="mt-3 text-xs text-destructive">
                    {rowErrors[faq.id]}
                  </p>
                )}

                {confirmDeleteId === faq.id && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2">
                    <p className="text-xs text-destructive">
                      Delete this FAQ? The assistant will stop using it.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => remove(faq.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {canEdit && faqs.length > 0 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={add}
            disabled={atLimit || adding}
            isLoading={adding}
            leftIcon={<LuPlus className="h-4 w-4" />}
          >
            Add FAQ
          </Button>
          {atLimit && (
            <p className="text-xs text-muted">
              You've reached the limit of {FAQ_LIMIT} FAQs.
            </p>
          )}
        </div>
      )}

      {!canEdit && (
        <p className="mt-4 text-xs text-muted">
          Only company admins can edit FAQs.
        </p>
      )}
    </div>
  );
}

function statusOf(faq: Faq) {
  if (faq.enabled) {
    return { label: "Live", className: "bg-success/10 text-success" };
  }
  if (faq.answer.trim()) {
    return { label: "Off", className: "bg-muted/30 text-muted" };
  }
  return { label: "Draft", className: "bg-warning/10 text-warning" };
}

function SaveIndicator({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) {
    return (
      <span
        className="flex items-center gap-1 text-xs text-muted"
        role="status"
      >
        <Spinner variant="muted" />
        Saving
      </span>
    );
  }
  if (saved) {
    return (
      <span
        className="flex items-center gap-1 text-xs text-success"
        role="status"
      >
        <LuCheck className="h-3 w-3" />
        Saved
      </span>
    );
  }
  return null;
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}
