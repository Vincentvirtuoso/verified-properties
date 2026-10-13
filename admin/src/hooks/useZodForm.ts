"use client";

import { useCallback, useState, type FormEvent } from "react";
import type { z, ZodTypeAny } from "zod";

type FieldErrors = Record<string, string | undefined>;

export function useZodForm<S extends ZodTypeAny>(
  schema: S,
  initial: z.input<S>,
) {
  type T = z.infer<S>;
  type Input = z.input<S>;

  const [values, setValues] = useState<Input>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});

  const setField = useCallback(
    <K extends keyof Input & string>(key: K, value: Input[K]) => {
      setValues((prev) => {
        const base = (prev ?? {}) as Record<string, unknown>;
        return { ...base, [key]: value } as Input;
      });
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    },
    [],
  );

  const reset = useCallback(
    (next?: Input) => {
      setValues(next ?? initial);
      setErrors({});
    },
    [initial],
  );

  const handleSubmit = useCallback(
    (onValid: (data: T) => void | Promise<void>) => (e: FormEvent) => {
      e.preventDefault();
      const parsed = schema.safeParse(values);
      if (!parsed.success) {
        const next: FieldErrors = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "");
          if (key && !next[key]) next[key] = issue.message;
        }
        setErrors(next);
        return;
      }
      setErrors({});
      void onValid(parsed.data);
    },
    [schema, values],
  );

  return { values, errors, setField, reset, handleSubmit };
}
