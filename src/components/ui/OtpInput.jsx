"use client";

import { useRef } from "react";

/** Six single-digit boxes with auto-advance, backspace, arrow keys and paste support. */
export default function OtpInput({ value, onChange, onComplete, length = 6, disabled = false, invalid = false, label = "One-time code" }) {
  const refs = useRef([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function setAt(index, char) {
    const next = digits.map((d, i) => (i === index ? char : d)).join("");
    onChange(next);
    if (next.length === length && !next.includes(" ") && digits.every((_, i) => (i === index ? char : digits[i]))) {
      onComplete?.(next);
    }
  }

  function handleChange(i, e) {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    if (!char) return;
    setAt(i, char);
    refs.current[Math.min(i + 1, length - 1)]?.focus();
  }

  function handleKeyDown(i, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) setAt(i, "");
      else if (i > 0) {
        refs.current[i - 1]?.focus();
        onChange(digits.map((d, idx) => (idx === i - 1 ? "" : d)).join(""));
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < length - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
    if (pasted.length === length) onComplete?.(pasted);
  }

  return (
    <div role="group" aria-label={label} className="flex gap-2 sm:gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={d}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={2}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          className={`size-12 rounded-md border bg-surface text-center text-xl font-semibold tabular-nums transition-colors focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25 sm:size-14 ${
            invalid ? "border-danger" : "border-line"
          }`}
        />
      ))}
    </div>
  );
}
