import { VerifiedBadge } from "@affilhomes/shared/ui";

export function FeatureItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        active
          ? "border-primary/30 bg-primary/5 text-primary"
          : "border-border bg-muted/20 text-muted"
      }`}
    >
      <span className={`text-lg ${active ? "text-primary" : "text-muted/50"}`}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active ? (
        <VerifiedBadge
          variant="success"
          showText={false}
          size="lg"
          className="ml-auto"
        />
      ) : (
        <span className="ml-auto text-xs text-muted">Off</span>
      )}
    </div>
  );
}
