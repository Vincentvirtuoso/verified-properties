import { cn } from "@/lib/utils";

interface FieldLabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function FieldLabel({
  htmlFor,
  children,
  required = false,
  className,
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium text-foreground mb-1.5",
        className,
      )}
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}
