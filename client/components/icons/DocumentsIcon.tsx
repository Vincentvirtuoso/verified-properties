import { forwardRef, type SVGProps } from "react";

export interface DocumentsIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width & height in px. Defaults to 24 (lucide default). */
  size?: number | string;
}

/**
 * Lucide-style "all documents" icon — a stacked pair of documents with
 * the back one peeking at the top-right. Matches lucide's stroke
 * conventions so it can sit next to `LuFileText`, `LuBookOpen`, etc.
 *
 *   <DocumentsIcon />
 *   <DocumentsIcon size={16} className="text-muted" />
 *   <DocumentsIcon aria-hidden={false} role="img" aria-label="All documents" />
 */
export const DocumentsIcon = forwardRef<SVGSVGElement, DocumentsIconProps>(
  function DocumentsIcon({ size = 24, strokeWidth = 2, ...props }, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {/* Back document — top-right edge peeking out */}
        <path d="M19 15 V5 a2 2 0 0 0 -2 -2 H9" />

        {/* Front document with folded corner */}
        <path d="M14 20 H8 a2 2 0 0 1 -2 -2 V7 a2 2 0 0 1 2 -2 h3 l5 5 v8 a2 2 0 0 1 -2 2 Z" />

        {/* Fold line inside the cut corner */}
        <path d="M11 5 v3 a2 2 0 0 0 2 2 h3" />

        {/* Content lines — signals "this is a document, not a rectangle" */}
        <path d="M8 14 h6" />
        <path d="M8 17 h4" />
      </svg>
    );
  },
);

DocumentsIcon.displayName = "DocumentsIcon";

export default DocumentsIcon;
