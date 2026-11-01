import { Button } from "@affilhomes/shared/ui";

export function AppealRow({
  open,
  onAppeal,
  subject,
}: {
  open: boolean;
  onAppeal: () => void;
  subject: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {open ? (
        <span className="text-xs text-muted">
          Appeal sent, waiting for a reply.
        </span>
      ) : (
        <Button size="sm" variant="outline" onClick={onAppeal}>
          Appeal
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        href={`/support?subject=${encodeURIComponent(`${subject} decision`)}`}
      >
        Contact support
      </Button>
    </div>
  );
}
