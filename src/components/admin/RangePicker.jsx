"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

const PRESETS = [
  ["today", "Today"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["month", "This month"],
];

/** value: { preset, from, to }. A custom range is only applied when "Apply" is pressed (no query per keystroke). */
export default function RangePicker({ value, onChange }) {
  const [draft, setDraft] = useState({ from: value.from ?? "", to: value.to ?? "" });
  const [showCustom, setShowCustom] = useState(value.preset === "custom");
  const btn = (active) => `min-h-9 rounded-full px-3.5 text-sm font-semibold transition-colors ${active ? "bg-brand text-white" : "text-ink/75 hover:bg-subtle"}`;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div role="group" aria-label="Date range" className="inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1">
        {PRESETS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={value.preset === id} className={btn(value.preset === id)} onClick={() => { setShowCustom(false); onChange({ preset: id }); }}>
            {label}
          </button>
        ))}
        <button type="button" aria-pressed={value.preset === "custom"} className={btn(value.preset === "custom" || showCustom)} onClick={() => setShowCustom(true)}>
          Custom
        </button>
      </div>
      {showCustom && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs font-medium text-muted">
            From
            <input type="date" value={draft.from} max={draft.to || undefined} onChange={(e) => setDraft({ ...draft, from: e.target.value })} className="mt-1 block h-10 rounded-md border border-line bg-surface px-2 text-sm text-ink" />
          </label>
          <label className="text-xs font-medium text-muted">
            To
            <input type="date" value={draft.to} min={draft.from || undefined} onChange={(e) => setDraft({ ...draft, to: e.target.value })} className="mt-1 block h-10 rounded-md border border-line bg-surface px-2 text-sm text-ink" />
          </label>
          <Button size="sm" disabled={!draft.from || !draft.to} onClick={() => onChange({ preset: "custom", from: draft.from, to: draft.to })}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}
