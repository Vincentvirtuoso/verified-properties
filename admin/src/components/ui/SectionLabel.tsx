import { type ElementType, ReactNode } from "react";

export function SectionLabel({
  icon: Icon,
  id,
  children,
}: {
  icon: ElementType;
  id?: string;
  children: ReactNode;
}) {
  return (
    <p
      id={id}
      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
    >
      <Icon size={12} aria-hidden="true" />
      {children}
    </p>
  );
}
