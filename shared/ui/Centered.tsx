import { ReactNode } from "react";

export function Centered({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        {children}
      </div>
    </section>
  );
}
