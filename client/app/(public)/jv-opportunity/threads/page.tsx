"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LuLock, LuMessageSquare } from "react-icons/lu";
import { Button } from "@affilhomes/shared/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatJvDate,
  listMyJvThreads,
  toJvViewer,
  type JvThreadSummary,
} from "@/lib/jv-api";

const READ_ONLY_LABEL: Record<
  NonNullable<JvThreadSummary["readOnlyReason"]>,
  string
> = {
  request_closed: "Read-only: request closed",
  inactive: "Read-only: inactive for 90 days",
};

export default function MyJvThreadsPage() {
  const { user, isAuthenticated } = useAuth();
  const viewer = useMemo(() => (user ? toJvViewer(user) : null), [user]);
  const [threads, setThreads] = useState<JvThreadSummary[] | null>(null);

  useEffect(() => {
    if (viewer) listMyJvThreads(viewer).then(setThreads);
  }, [viewer]);

  if (!isAuthenticated || !viewer) {
    return (
      <main className="py-24 text-center">
        <LuLock className="w-10 h-10 mx-auto mb-4 text-primary" />
        <p className="text-subtle mb-6">
          Sign in to see your JV conversations.
        </p>
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
      </main>
    );
  }

  if (!threads)
    return (
      <main className="py-24 text-center text-subtle">
        Loading conversations…
      </main>
    );

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My JV Threads</h1>
        <p className="text-subtle mt-2">
          Conversations from accepted requests. These stay available even if
          your subscription has lapsed.
        </p>
      </header>

      {threads.length === 0 && (
        <p className="text-subtle text-center py-16">
          No accepted conversations yet.
        </p>
      )}

      <ul className="space-y-3">
        {threads.map((t) => (
          <li key={t.id}>
            <Link
              href={`/jv-opportunity/threads/${t.id}`}
              className="flex gap-4 bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
            >
              <LuMessageSquare className="w-5 h-5 text-primary shrink-0 mt-1" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-semibold text-foreground truncate">
                    {t.requestTitle}
                  </h2>
                  <span className="text-xs text-muted">
                    {formatJvDate(t.lastActivityAt)}
                  </span>
                </div>
                <p className="text-sm text-muted mt-0.5">{t.counterpartName}</p>
                <p className="text-sm text-subtle mt-2 truncate">
                  {t.lastMessagePreview}
                </p>
                {t.readOnly && t.readOnlyReason && (
                  <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full bg-inverse text-muted">
                    {READ_ONLY_LABEL[t.readOnlyReason]}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
