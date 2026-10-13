"use client";

import { useCallback, useEffect, useState } from "react";
import { errorText } from "@affilhomes/shared/supabase/admin";

/** Loads an admin list and reloads it when `deps` change or reload() is called. */
export function useAdminList<T>(load: () => Promise<T[]>, deps: unknown[]) {
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps) + ":" + tick;
  const [state, setState] = useState<{ key: string; rows: T[] | null; error: string | null }>({
    key: "",
    rows: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    load()
      .then((rows) => !cancelled && setState({ key, rows, error: null }))
      .catch((e) => !cancelled && setState({ key, rows: [], error: errorText(e, "Couldn't load this list.") }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { rows: current ? state.rows : null, error: current ? state.error : null, reload };
}
