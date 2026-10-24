import { type ReactNode } from "react";

const SectionLabel = ({
  text,
  children,
}: {
  text: string;
  children?: ReactNode;
}) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-4 py-1 text-xs text-foreground uppercase tracking-widest">
          {text}
          {children}
        </span>
      </div>
    </div>
  );
};

export default SectionLabel;

// (alias) type ReviewStatus = "none" | "pending" | "approved" | "rejected" | "changes_requested"