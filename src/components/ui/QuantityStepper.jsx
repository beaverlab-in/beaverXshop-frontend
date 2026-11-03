"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/Icons";

export default function QuantityStepper({ value, onChange, min = 1, max = 10, label = "Quantity", size = "md" }) {
  const btn =
    "grid place-items-center text-ink transition-colors hover:bg-subtle disabled:text-muted/40 disabled:hover:bg-transparent " +
    (size === "sm" ? "size-9" : "size-11");
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-md border border-line bg-surface"
    >
      <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <MinusIcon className="size-4" />
      </button>
      <span className="min-w-8 text-center font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
