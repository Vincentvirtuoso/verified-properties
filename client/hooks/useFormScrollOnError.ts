"use client";

import { useCallback } from "react";

export function useFormScrollOnError<
  T extends HTMLFormElement | HTMLDivElement,
>() {
  return useCallback((form: T | null) => {
    if (!form) return;
    requestAnimationFrame(() => {
      const firstInvalid = form.querySelector<HTMLElement>(
        '[aria-invalid="true"]',
      );
      if (!firstInvalid) return;

      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });

      const input = firstInvalid.querySelector<HTMLInputElement>("input");
      input?.focus({ preventScroll: true });
    });
  }, []);
}
