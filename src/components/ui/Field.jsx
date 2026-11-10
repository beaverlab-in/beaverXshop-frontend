"use client";

import { useId } from "react";

const control =
  "w-full min-h-11 rounded-md border bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted/70 " +
  "transition-colors hover:border-brand/40 focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25 " +
  "disabled:bg-canvas disabled:text-muted";

/**
 * Label + control + hint + error, correctly wired for screen readers.
 * `as` can be "input" | "select" | "textarea".
 */
export default function Field({ label, hint, error, as = "input", className = "", children, optional = false, ...props }) {
  const id = useId();
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;
  const Tag = as;
  const borderClass = error ? "border-danger" : "border-line";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
      </label>
      <Tag
        id={id}
        className={`${control} ${borderClass} ${as === "textarea" ? "min-h-28" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      >
        {as === "select" ? children : undefined}
      </Tag>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
