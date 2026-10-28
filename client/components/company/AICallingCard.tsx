import { Badge, Button } from "@affilhomes/shared/ui";
import { LuPhoneCall, LuChevronRight } from "react-icons/lu";
import { UpgradeToProCTA } from "../common/UpgradeToProCTA";

export function AICallingCard({
  isVerified,
  isPending,
  isPro,
}: {
  isVerified: boolean;
  isPending: boolean;
  isPro: boolean;
}) {
  if (isVerified && isPro) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LuPhoneCall className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">AI Calling</h2>
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Live
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              Every new enquiry gets an automatic follow-up call. Review
              transcripts and outcomes in Enquiries.
            </p>
          </div>
          <Button variant="outline" size="sm" href="/enquiries">
            View Enquiries
            <LuChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isVerified && !isPro) {
    return <UpgradeToProCTA variant="card" />;
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/30 text-muted">
          <LuPhoneCall className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-muted">AI Calling</h2>
          <p className="mt-1 text-sm text-muted">
            {isPending
              ? "You can start configuring your AI assistant now in draft mode. Activation unlocks once verification clears."
              : "Available on the Pro tier once your company is verified."}
          </p>
        </div>
        {isPending && (
          <Button variant="outline" size="sm">
            Configure Draft
          </Button>
        )}
      </div>
    </div>
  );
}
