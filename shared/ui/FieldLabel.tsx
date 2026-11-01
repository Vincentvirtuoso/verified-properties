import { cn } from "../utils";

interface FieldLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
  hint?: string | React.ReactNode;
}

export function FieldLabel({
  htmlFor,
  children,
  required = false,
  className,
  hint,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "flex text-sm font-medium text-foreground mb-1.5 justify-between",
        className,
      )}
    >
      <span className="block">
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {hint &&
        (typeof hint === "string" ? (
          <span className="text-muted text-xs font-normal">{hint}</span>
        ) : (
          hint
        ))}
    </label>
  );
}
