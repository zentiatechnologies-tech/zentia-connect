import { useCallback, useEffect, useRef, useState } from "react";

/** Loads data for a page and reloads when `deps` change. */
export function useData<T>(load: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const run = useCallback(() => {
    const mine = ++seq.current;
    setLoading(true);
    setError(null);
    load()
      .then((d) => mine === seq.current && setData(d))
      .catch((e) => mine === seq.current && setError(e?.message ?? String(e)))
      .finally(() => mine === seq.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { data, error, loading, reload: run, setData };
}
