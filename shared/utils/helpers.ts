import { ImageLoaderProps } from "next/image";

export const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  return `${src}?w=${width}&q=${quality || 75}`;
};

import { isValidElement, type ElementType } from "react";

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

export function isAuthServiceError(
  error: { name?: string; status?: number } | null,
): boolean {
  if (!error) return false;
  if (error.name === "AuthSessionMissingError") return false;
  return (
    error.name === "AuthRetryableFetchError" ||
    error.status === undefined ||
    error.status >= 500
  );
}

export function getErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof Error) {
    const msg = err.message?.trim();
    if (msg) return msg;
  }

  if (typeof err === "string") {
    const msg = err.trim();
    if (msg) return msg;
  }

  if (typeof err === "object" && err !== null) {
    const candidate =
      readString((err as { error?: unknown }).error, "message") ??
      readString(err, "message");

    if (candidate) return candidate;
  }

  return fallback;
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const prop = (value as Record<string, unknown>)[key];
  if (typeof prop !== "string") return undefined;
  const trimmed = prop.trim();
  return trimmed || undefined;
}

export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}