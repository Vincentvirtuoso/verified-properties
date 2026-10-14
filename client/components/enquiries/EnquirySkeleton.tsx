import { cn } from "@/utils";

export function EnquiriesSkeleton() {
  return (
    <div className="h-[calc(100dvh-var(--banner-navbar-height,80px)-70px)] flex">
      <div className="w-full md:w-90 md:shrink-0 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border space-y-2">
          <div className="h-5 w-32 rounded bg-muted/30 animate-pulse" />
          <div className="h-3.5 w-56 max-w-full rounded bg-muted/30 animate-pulse" />
        </div>

        <div className="flex-1 overflow-hidden divide-y divide-border animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <EnquiryListItemSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="flex-1 hidden md:flex flex-col">
        <EnquiryThreadSkeleton />
      </div>
    </div>
  );
}

function EnquiryListItemSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5">
      <div className="h-10 w-10 rounded-full bg-muted/30 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="h-4 w-28 rounded bg-muted/30" />
          <div className="h-3 w-10 rounded bg-muted/30 shrink-0" />
        </div>
        <div className="h-3.5 w-3/4 rounded bg-muted/30" />
        <div className="h-3 w-1/2 rounded bg-muted/30" />
      </div>
    </div>
  );
}

function EnquiryThreadSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="h-10 w-10 rounded-full bg-muted/30 shrink-0 animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2 animate-pulse">
          <div className="h-4 w-40 rounded bg-muted/30" />
          <div className="h-3 w-56 max-w-full rounded bg-muted/30" />
        </div>
        <div className="h-8 w-8 rounded-full bg-muted/30 shrink-0 animate-pulse" />
      </div>

      <div className="flex items-center gap-3 border-b border-border px-4 py-3 animate-pulse">
        <div className="h-12 w-16 rounded-lg bg-muted/30 shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted/30" />
          <div className="h-3 w-1/3 rounded bg-muted/30" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden space-y-4 px-4 py-5 animate-pulse">
        <MessageBubble side="left" width="w-2/3" />
        <MessageBubble side="right" width="w-1/2" />
        <MessageBubble side="left" width="w-3/4" />
        <MessageBubble side="right" width="w-1/3" />
        <MessageBubble side="left" width="w-1/2" />
      </div>

      <div className="border-t border-border px-4 py-3 animate-pulse">
        <div className="flex items-end gap-2">
          <div className="h-11 flex-1 rounded-xl border border-border bg-card" />
          <div className="h-11 w-11 rounded-xl bg-muted/30 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  side,
  width,
}: {
  side: "left" | "right";
  width: string;
}) {
  return (
    <div
      className={cn("flex", side === "right" ? "justify-end" : "justify-start")}
    >
      <div className={cn("space-y-1.5", width)}>
        <div
          className={cn(
            "h-10 rounded-2xl bg-muted/30",
            side === "right" ? "rounded-br-sm" : "rounded-bl-sm",
          )}
        />
        <div className="h-3 w-16 rounded bg-muted/30" />
      </div>
    </div>
  );
}
