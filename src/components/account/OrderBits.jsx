import { Badge } from "@/components/ui/Layout";
import { ORDER_PROGRESS, ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";

const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" });
const dayFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

export const formatDateTime = (iso) => (iso ? dateFmt.format(new Date(iso)) : "");
export const formatDay = (iso) => (iso ? dayFmt.format(new Date(iso)) : "");

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function PaymentBadge({ status }) {
  const meta = PAYMENT_STATUS[status] ?? { label: status, tone: "neutral" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** Horizontal progress through the delivery journey (hidden for cancelled/returned orders). */
export function OrderProgress({ status }) {
  const index = ORDER_PROGRESS.indexOf(status);
  if (index < 0) return null;
  return (
    <ol className="grid grid-cols-3 gap-y-5 sm:grid-cols-6" aria-label="Order progress">
      {ORDER_PROGRESS.map((step, i) => {
        const done = i <= index;
        return (
          <li key={step} className="relative flex flex-col items-center text-center" aria-current={i === index ? "step" : undefined}>
            <span className={`grid size-8 place-items-center rounded-full text-sm font-bold ${done ? "bg-brand text-white" : "bg-subtle text-muted"}`}>
              {done ? "✓" : i + 1}
            </span>
            <span className={`mt-2 text-xs font-medium sm:text-sm ${done ? "text-ink" : "text-muted"}`}>{ORDER_STATUS[step].label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Timeline({ events }) {
  const sorted = [...events].sort((a, b) => new Date(b.at) - new Date(a.at));
  return (
    <ol className="relative space-y-5 border-l-2 border-line pl-6">
      {sorted.map((e, i) => (
        <li key={`${e.at}-${i}`} className="relative">
          <span className={`absolute top-1 -left-[1.95rem] size-3 rounded-full ring-4 ring-surface ${i === 0 ? "bg-brand" : "bg-line"}`} aria-hidden="true" />
          <p className="font-semibold">{ORDER_STATUS[e.status]?.label ?? e.status}</p>
          {e.note && <p className="text-sm text-muted">{e.note}</p>}
          <p className="text-xs text-muted">{formatDateTime(e.at)}</p>
        </li>
      ))}
    </ol>
  );
}
