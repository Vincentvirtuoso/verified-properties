import { ReactNode } from "react";
import { cn } from "../utils";

export function Centered({
  children,
  className,
  subClassName,
}: {
  children: ReactNode;
  className?: string;
  subClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex min-h-[60vh] items-center justify-center px-4 py-16",
        className,
      )}
    >
      <div
        className={cn(
          "w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center",
          subClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}
