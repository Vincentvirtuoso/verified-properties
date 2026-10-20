import { forwardRef, type SVGProps } from "react";

export interface DocumentsIconProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const DocumentsIcon = forwardRef<
  SVGSVGElement,
  DocumentsIconProps
>(function DocumentsIcon(
  {
    size = 16,
    strokeWidth = 2,
    "aria-hidden": ariaHidden,
    ...props
  },
  ref,
) {
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
      aria-hidden={ariaHidden ?? (props["aria-label"] ? undefined : true)}
      focusable="false"
      {...props}
    >
      <path d="M18 14V5a2 2 0 0 0-2-2H9" />

      <path d="M14 21H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l5 5v9a2 2 0 0 1-2 2Z" />

      <path d="M11 5v3a2 2 0 0 0 2 2h3" />

      <path d="M8 14h6" />
      <path d="M8 17h4" />
    </svg>
  );
});

DocumentsIcon.displayName = "DocumentsIcon";

export default DocumentsIcon;
