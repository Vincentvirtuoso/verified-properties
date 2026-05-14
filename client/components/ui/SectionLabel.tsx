import React from "react";

const SectionLabel = ({ text }: { text: string }) => {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-4 py-1 text-xs text-foreground uppercase tracking-widest">
          {text}
        </span>
      </div>
    </div>
  );
};

export default SectionLabel;
