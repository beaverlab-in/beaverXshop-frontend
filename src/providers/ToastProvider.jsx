"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckIcon, CloseIcon, AlertIcon } from "@/components/ui/Icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (message, { tone = "success", action } = {}) => {
      const id = ++idRef.current;
      setToasts((t) => [...t.slice(-2), { id, message, tone, action }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push(m, { ...o, tone: "success" }),
      error: (m, o) => push(m, { ...o, tone: "danger" }),
      info: (m, o) => push(m, { ...o, tone: "info" }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border border-line bg-surface p-4 shadow-lift [animation:toast-in_250ms_var(--ease-brand)]"
          >
            <span className={t.tone === "danger" ? "text-danger" : "text-success"} aria-hidden="true">
              {t.tone === "danger" ? <AlertIcon className="size-5" /> : <CheckIcon className="size-5" />}
            </span>
            <div className="flex-1 text-sm">
              <p className="font-medium text-ink">{t.message}</p>
              {t.action}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-m-1 rounded p-1 text-muted hover:text-ink"
              aria-label="Dismiss notification"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
