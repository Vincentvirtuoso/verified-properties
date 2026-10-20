"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LuArrowLeft, LuLock } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  JvApiError,
  getJvThread,
  sendJvMessage,
  toJvViewer,
  type JvThreadDetail,
} from "@/lib/jv-api";

const READ_ONLY_TEXT: Record<
  NonNullable<JvThreadDetail["readOnlyReason"]>,
  string
> = {
  request_closed:
    "This request has been closed, so the conversation is read-only.",
  inactive:
    "No messages for 90 days, so the conversation is read-only. Messages from either party will reopen it only if the request is still open.",
};

export default function JvThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);

  const [thread, setThread] = useState<JvThreadDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!viewer) return;
    try {
      setThread(await getJvThread(viewer, id));
      setError(null);
    } catch (err) {
      setError(
        err instanceof JvApiError
          ? err.message
          : "Could not load this conversation.",
      );
    }
  }, [viewer, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread?.messages.length]);

  const handleSend = async () => {
    if (!viewer || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendJvMessage(viewer, id, draft);
      setDraft("");
      await load();
    } catch (err) {
      setError(
        err instanceof JvApiError
          ? err.message
          : "Message not sent. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated || !viewer) {
    return (
      <main className="py-24 text-center">
        <LuLock className="w-10 h-10 mx-auto mb-4 text-primary" />
        <p className="text-subtle mb-6">Sign in to view this conversation.</p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="py-24 text-center text-subtle">
        {error ?? "Loading conversation…"}
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 flex flex-col min-h-[80vh]">
      <Link
        href="/jv-opportunity/threads"
        className="inline-flex items-center gap-2 text-sm text-primary mb-6"
      >
        <LuArrowLeft /> All threads
      </Link>

      <header className="bg-card border border-border rounded-xl p-5 mb-6">
        <h1 className="text-xl font-bold text-foreground">
          {thread.requestTitle}
        </h1>
        <p className="text-sm text-subtle mt-1">
          {thread.counterpart.name} · {thread.counterpart.phone} ·{" "}
          {thread.counterpart.email}
        </p>
      </header>

      {thread.readOnly && thread.readOnlyReason && (
        <div className="mb-4 rounded-lg bg-inverse p-3 text-sm text-muted">
          {READ_ONLY_TEXT[thread.readOnlyReason]}
        </div>
      )}

      <div className="flex-1 space-y-3 mb-6">
        {thread.messages.length === 0 && (
          <p className="text-center text-subtle py-12">
            No messages yet. Say hello to start.
          </p>
        )}
        {thread.messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                m.isMine
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {!m.isMine && (
                <p className="text-xs font-semibold mb-1 opacity-70">
                  {m.senderName}
                </p>
              )}
              <p>{m.text}</p>
              <p
                className={`text-[11px] mt-1 ${m.isMine ? "text-white/70" : "text-muted"}`}
              >
                {new Date(m.sentAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-4 bg-card border border-border rounded-xl p-3 flex gap-3 items-end">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={thread.readOnly || sending}
          rows={2}
          maxLength={2000}
          placeholder={
            thread.readOnly
              ? "This conversation is read-only"
              : "Write a message"
          }
          className="flex-1 resize-none rounded-lg border border-border bg-transparent p-2 text-sm text-foreground disabled:opacity-50"
        />
        <Button
          onClick={handleSend}
          disabled={thread.readOnly || sending || !draft.trim()}
        >
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
    </main>
  );
}
