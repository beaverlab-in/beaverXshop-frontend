"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { ArrowLeftIcon, ArrowRightIcon, CloseIcon, AlertIcon } from "@/components/ui/Icons";
import { formatINR } from "@/lib/money";

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-ink md:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className = "", padded = true }) {
  return (
    <section className={`min-w-0 rounded-card border border-line bg-surface shadow-card ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, hint, tone = "default", href }) {
  const toneCls = tone === "warning" ? "text-[#8a5a00]" : tone === "danger" ? "text-danger" : "text-ink";
  const body = (
    <>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${toneCls}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </>
  );
  const cls = "block rounded-card border border-line bg-surface p-5 shadow-card";
  return href ? (
    <Link href={href} className={`${cls} card-hover`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Responsive table. `columns`: [{ key, header, render?(row), align?, className? }]. */
export function DataTable({ columns, rows, loading = false, empty = "Nothing to show yet.", rowKey = (r) => r.id, onRowClick, caption }) {
  const first = loading && !rows;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={`px-4 py-3 ${c.align === "right" ? "text-right" : ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={loading && rows ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {first &&
            Array.from({ length: 5 }, (_, i) => (
              <tr key={i} className="border-b border-line/60">
                <td colSpan={columns.length} className="px-4 py-3">
                  <Skeleton className="h-6" />
                </td>
              </tr>
            ))}
          {!first && rows?.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-14 text-center text-muted">
                {empty}
              </td>
            </tr>
          )}
          {rows?.map((row) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-line/60 last:border-0 ${onRowClick ? "cursor-pointer hover:bg-tint/30" : ""}`}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.className ?? ""}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return meta ? <p className="px-4 py-3 text-sm text-muted">{meta.total} total</p> : null;
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
      <p className="text-muted">
        Page {meta.page} of {meta.pages} · {meta.total} total
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
          <ArrowLeftIcon className="size-4" /> Previous
        </Button>
        <Button size="sm" variant="secondary" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>
          Next <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </nav>
  );
}

/** Native <dialog>: focus is trapped, Escape closes, and the page behind is inert. */
export function Modal({ open, title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-[calc(100%-2rem)] rounded-card border border-line bg-surface p-0 text-ink shadow-lift backdrop:bg-night/50 ${wide ? "max-w-3xl" : "max-w-lg"}`}
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <h2 id="modal-title" className="text-lg font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-tint/60" aria-label="Close">
              <CloseIcon className="size-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger = false, busy = false, onConfirm, onCancel, children }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="leading-relaxed">{message}</p>}
      {children}
    </Modal>
  );
}

export function Tabs({ tabs, value, onChange, label = "Sections" }) {
  return (
    <div role="tablist" aria-label={label} className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`-mb-px min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition-colors ${value === t.value ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="mb-4 flex flex-wrap items-center gap-3 rounded-md border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
      <AlertIcon className="size-5 shrink-0" />
      <span className="flex-1 font-medium">{error.message || "Something went wrong."}</span>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

/** Revenue-style bar chart in plain SVG (no chart library). Each bar has a text label for assistive tech. */
export function BarChart({ data, valueKey = "revenuePaise", labelKey = "date", height = 180, format = formatINR }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const w = Math.max(data.length * 22, 300);
  const pad = 22;
  const total = data.reduce((a, d) => a + d[valueKey], 0);
  return (
    <figure>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${height + pad}`} className="h-auto w-full min-w-[20rem]" role="img" aria-label={`Bar chart, ${data.length} days, total ${format(total)}`}>
          <line x1="0" x2={w} y1={height} y2={height} stroke="var(--color-line)" />
          {data.map((d, i) => {
            const bw = Math.max(4, (w / data.length) * 0.62);
            const x = (w / data.length) * i + ((w / data.length) - bw) / 2;
            const h = (d[valueKey] / max) * (height - 12);
            return (
              <g key={d[labelKey]}>
                <rect x={x} y={height - h} width={bw} height={Math.max(h, d[valueKey] > 0 ? 2 : 0)} rx="3" fill="var(--color-brand)" opacity={d[valueKey] ? 1 : 0.15}>
                  <title>{`${d[labelKey]}: ${format(d[valueKey])}`}</title>
                </rect>
                {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0) && (
                  <text x={x + bw / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="var(--color-muted)">
                    {String(d[labelKey]).slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption className="sr-only">{data.map((d) => `${d[labelKey]} ${format(d[valueKey])}`).join(", ")}</figcaption>
    </figure>
  );
}

export const formatDate = (iso) => (iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso)) : "");
export const formatDateTime = (iso) => (iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "");

/** Filters row: simple flex-wrap container. */
export function FilterBar({ children }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-line px-4 py-4">{children}</div>;
}
