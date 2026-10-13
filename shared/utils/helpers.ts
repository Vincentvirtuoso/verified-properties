import { ImageLoaderProps } from "next/image";

export const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  return `${src}?w=${width}&q=${quality || 75}`;
};

import { isValidElement, type ElementType, type ReactNode } from "react";

const COMPONENT_SYMBOLS = new Set([
  Symbol.for("react.memo"),
  Symbol.for("react.forward_ref"),
  Symbol.for("react.lazy"),
]);

export function isComponentType(value: unknown): value is ElementType {
  if (typeof value === "function") return true;

  if (isValidElement(value)) return false;

  if (typeof value !== "object" || value === null) return false;

  const tag = (value as { $$typeof?: unknown }).$$typeof;
  return typeof tag === "symbol" && COMPONENT_SYMBOLS.has(tag);
}

