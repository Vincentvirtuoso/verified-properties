"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseAdminListResult<T> = {
  rows: T[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

export function useAdminList<T>(
  fetcher: () => Promise<T[]>,
  deps: unknown[] = [],
): UseAdminListResult<T> {
  const [state, setState] = useState<{
    rows: T[] | null;
    error: string | null;
    loading: boolean;
  }>({ rows: null, error: null, loading: true });

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestIdRef = useRef(0);

  const load = useCallback(async (resetRows: boolean) => {
    const id = ++requestIdRef.current;
    setState((s) => ({
      rows: resetRows ? null : s.rows,
      error: null,
      loading: true,
    }));

    try {
      const data = await fetcherRef.current();
      if (id !== requestIdRef.current) return;
      setState({ rows: data, error: null, loading: false });
    } catch (err) {
      if (id !== requestIdRef.current) return;
      setState((s) => ({
        rows: s.rows,
        error:
          err instanceof Error && err.message
            ? err.message
            : "Couldn't load this list. Try again.",
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void load(true);
    return () => {
      requestIdRef.current++;
    };
  }, deps);

  const reload = useCallback(() => load(false), [load]);

  return { ...state, reload };
}
