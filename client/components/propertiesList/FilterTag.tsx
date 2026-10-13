"use client";

import { LuX } from "react-icons/lu";
import { Badge } from "@affilhomes/shared/ui";

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <Badge variant="info" className="cursor-pointer gap-1.5">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <LuX className="w-3.5 h-3.5" />
      </button>
    </Badge>
  );
}
