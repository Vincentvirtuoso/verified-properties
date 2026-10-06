"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LuArrowLeft,
  LuChevronDown,
  LuPhone,
  LuPhoneMissed,
  LuSend,
} from "react-icons/lu";

import type { Enquiry, ThreadEvent } from "@/types/enquiry";
import { format } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/Textarea";

interface EnquiryThreadProps {
  enquiry: Enquiry;
  isAgentSide: boolean;
  onBack: () => void;
}

type EventGroup = {
  key: string;
  label: string;
  events: ThreadEvent[];
};

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateGroupLabel(date: Date) {
  const today = new Date();

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return format(date, "EEE, do MMMM yyyy");
}

function groupEvents(events: ThreadEvent[]): EventGroup[] {
  const groups = events.reduce<Map<string, EventGroup>>((groups, event) => {
    const date = new Date(event.timestamp);

    if (Number.isNaN(date.getTime())) return groups;

    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    const existing = groups.get(key);

    if (existing) {
      existing.events.push(event);
    } else {
      groups.set(key, {
        key,
        label: getDateGroupLabel(date),
        events: [event],
      });
    }

    return groups;
  }, new Map());

  return Array.from(groups.values());
}

export function EnquiryThread({
  enquiry,
  isAgentSide,
  onBack,
}: EnquiryThreadProps) {
  const [draft, setDraft] = useState("");
  const [events, setEvents] = useState(enquiry.events);

  useEffect(() => {
    setEvents(enquiry.events);
  }, [enquiry.id, enquiry.events]);

  const groupedEvents = useMemo(() => groupEvents(events), [events]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    const text = draft.trim();
    if (!text) return;

    const newMessage: ThreadEvent = {
      type: "message",
      id: `local_${Date.now()}`,
      sender: isAgentSide ? "agent" : "buyer",
      text,
      timestamp: new Date(),
    };

    setEvents((prev) => [...prev, newMessage]);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden -ml-1 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground"
            aria-label="Back to enquiries"
          >
            <LuArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {isAgentSide ? enquiry.buyerName : enquiry.agentName}
            </p>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {enquiry.propertyTitle}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium capitalize text-primary">
            {enquiry.stage}
          </span>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-6">
          {groupedEvents.map((group) => (
            <section key={group.key}>
              <div className="mb-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />

                <span className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[10px] font-medium text-muted-foreground shadow-sm">
                  {group.label}
                </span>

                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                {group.events.map((event) =>
                  event.type === "message" ? (
                    <MessageBubble key={event.id} event={event} />
                  ) : (
                    <CallCard key={event.id} event={event} />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <ChatComposer onSend={handleSend} />
    </div>
  );
}

function MessageBubble({
  event,
}: {
  event: Extract<ThreadEvent, { type: "message" }>;
}) {
  const isBuyer = event.sender === "buyer";

  return (
    <div className={cn("flex", isBuyer ? "justify-end" : "justify-start")}>
      <div className="max-w-[78%] sm:max-w-[65%]">
        <div
          className={cn(
            "px-4 py-3 text-sm leading-relaxed shadow-sm",
            isBuyer
              ? "rounded-2xl rounded-br-xs bg-primary text-primary-foreground"
              : "rounded-2xl rounded-bl-xs border border-border bg-card text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{event.text}</p>

          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-[10px]",
              isBuyer
                ? "justify-end text-primary-foreground/65"
                : "text-muted-foreground",
            )}
          >
            {event.sender === "assistant" && <span>Assistant ·</span>}
            <span>{format(event.timestamp, "HH:mm")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CallCard({
  event,
}: {
  event: Extract<ThreadEvent, { type: "call" }>;
}) {
  const [expanded, setExpanded] = useState(false);

  const minutes = Math.floor(event.durationSeconds / 60);
  const seconds = event.durationSeconds % 60;

  const isMissed = event.outcome === "missed";

  return (
    <div className="flex justify-center py-1">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              isMissed
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-primary",
            )}
          >
            {isMissed ? (
              <LuPhoneMissed className="h-4 w-4" />
            ) : (
              <LuPhone className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">
              {event.caller === "assistant" ? "Assistant call" : "Agent call"}
              {isMissed && (
                <span className="font-medium text-destructive">
                  {" · Missed"}
                </span>
              )}
            </p>

            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {format(event.timestamp, "EEE, do MMMM yyyy · HH:mm")}

              {event.outcome === "answered" &&
                ` · ${minutes}:${String(seconds).padStart(2, "0")}`}
            </p>
          </div>

          {event.transcript && (
            <button
              onClick={() => setExpanded((value) => !value)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={expanded ? "Hide transcript" : "Show transcript"}
              aria-expanded={expanded}
            >
              <LuChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>
          )}
        </div>

        {event.summary && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {event.summary}
          </p>
        )}

        {expanded && event.transcript && (
          <div className="mt-3 border-t border-border pt-3">
            <p className="whitespace-pre-line text-[11px] leading-relaxed text-muted-foreground">
              {event.transcript}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ChatComposerProps {
  onSend: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  minRows?: number;
  maxRows?: number;
  className?: string;
}

const LINE_HEIGHT = 20;
const VERTICAL_PADDING = 20;

function ChatComposer({
  onSend,
  placeholder = "Type a message…",
  disabled = false,
  minRows = 1,
  maxRows = 5,
  className,
}: ChatComposerProps) {
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const minHeight = LINE_HEIGHT * minRows + VERTICAL_PADDING;
  const maxHeight = LINE_HEIGHT * maxRows + VERTICAL_PADDING;

  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${next}px`;

    setIsOverflowing(el.scrollHeight > maxHeight);
  }, [draft, maxHeight]);

  const submit = (e: React.FormEvent) => {
    const text = draft.trim();
    if (!text || disabled) return;
    onSend(e);
    setDraft("");

    const el = textareaRef.current;
    if (el) el.style.height = `${minHeight}px`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(e);
    }
  };

  return (
    <div
      className={cn(
        "border-t border-border bg-card px-4 py-3 sticky bottom-0",
        className,
      )}
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={minRows}
          style={{ minHeight, maxHeight }}
          className={cn(
            "flex-1 resize-none rounded-2xl border border-border",
            isOverflowing ? "overflow-y-auto" : "overflow-hidden",
            "bg-background px-4 py-2.5 text-sm leading-5 text-foreground",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        <button
          type="submit"
          disabled={!draft.trim() || disabled}
          aria-label="Send message"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground transition-opacity",
            "disabled:opacity-40",
          )}
        >
          <LuSend className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
