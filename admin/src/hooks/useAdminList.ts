"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseAdminListResult<T> = {
  rows: T[] | null;
  error: string | null;
  loading: boolean;
  reload: () => Promise<void>;
};

/**
 * Small fetch helper for admin tab lists.
 *
 * `deps` drives the initial fetch — pass the same values the fetcher
 * closes over (filters, status, etc.). The fetcher itself is stored in
 * a ref, so you don’t need to memoize it.
 */
export function useAdminList<T>(
  fetcher: () => Promise<T[]>,
  deps: unknown[] = [],
): UseAdminListResult<T> {
  const [rows, setRows] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await fetcherRef.current();
      if (!mountedRef.current) return;
      setRows(data);
    } catch (err) {
      if (!mountedRef.current) return;
      setRows([]);
      setError(err instanceof Error ? err.message : "Couldn’t load this list.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { rows, error, loading, reload };
}
