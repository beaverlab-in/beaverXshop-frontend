"use client";

import { useCallback, useEffect, useState } from "react";
import { admin } from "@/lib/client/adminApi";

/**
 * Loads a (paginated) admin endpoint and reloads when `params` change. The previous rows stay visible
 * while the next ones load (`loading` is true meanwhile), and stale responses are ignored.
 */
export default function useAdminList(path, params = {}, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, meta: null, error: null, doneFor: null });
  const [version, setVersion] = useState(0);
  const key = `${path}|${JSON.stringify(params)}|${version}`;

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    admin.list(path, JSON.parse(key.split("|")[1])).then(
      ({ data, meta }) => alive && setState({ data, meta, error: null, doneFor: key }),
      (error) => alive && setState((s) => ({ ...s, error, doneFor: key })),
    );
    return () => {
      alive = false;
    };
  }, [path, key, enabled]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data: state.data, meta: state.meta, error: state.doneFor === key ? state.error : null, loading: enabled && state.doneFor !== key, reload };
}
