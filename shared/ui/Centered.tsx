import { ReactNode } from "react";
import { cn } from "../utils";

export function Centered({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4 py-16",
        className,
      )}
    >
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        {children}
      </div>
    </section>
  );
}
