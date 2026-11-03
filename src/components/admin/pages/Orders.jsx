"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DataTable, ErrorBanner, FilterBar, PageHeader, Pagination, Panel, formatDateTime } from "@/components/admin/ui";
import { PaymentBadge, StatusBadge } from "@/components/account/OrderBits";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatINR } from "@/lib/money";

const selectCls = "h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25";
const inputCls = selectCls;

export default function Orders() {
  const sp = useSearchParams();
  const initial = { q: sp.get("q") ?? "", status: sp.get("status") ?? "", paymentStatus: sp.get("paymentStatus") ?? "", method: sp.get("method") ?? "", from: sp.get("from") ?? "", to: sp.get("to") ?? "" };
  const [draft, setDraft] = useState(initial);
  const [filters, setFilters] = useState(initial);
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/orders", { ...filters, page });

  const apply = (e) => {
    e?.preventDefault();
    setFilters(draft);
    setPage(1);
  };
  const clear = () => {
    const empty = { q: "", status: "", paymentStatus: "", method: "", from: "", to: "" };
    setDraft(empty);
    setFilters(empty);
    setPage(1);
  };
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <PageHeader title="Orders" description="Search, filter and open any order. Search by order number (BL-…), customer name or mobile." />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <form onSubmit={apply}>
          <FilterBar>
            <label className="min-w-52 flex-1 text-xs font-medium text-muted">
              Search
              <input value={draft.q} onChange={set("q")} placeholder="BL-250101-ABCD, name or mobile" className={`${inputCls} mt-1 w-full`} />
            </label>
            <label className="text-xs font-medium text-muted">
              Order status
              <select value={draft.status} onChange={set("status")} className={`${selectCls} mt-1 block`}>
                <option value="">All</option>
                {Object.entries(ORDER_STATUS).map(([v, m]) => (
                  <option key={v} value={v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Payment
              <select value={draft.paymentStatus} onChange={set("paymentStatus")} className={`${selectCls} mt-1 block`}>
                <option value="">All</option>
                {Object.entries(PAYMENT_STATUS).map(([v, m]) => (
                  <option key={v} value={v}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Method
              <select value={draft.method} onChange={set("method")} className={`${selectCls} mt-1 block`}>
                <option value="">All</option>
                <option value="online">Online</option>
                <option value="cod">Cash on delivery</option>
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              From
              <input type="date" value={draft.from} onChange={set("from")} className={`${inputCls} mt-1 block`} />
            </label>
            <label className="text-xs font-medium text-muted">
              To
              <input type="date" value={draft.to} onChange={set("to")} className={`${inputCls} mt-1 block`} />
            </label>
            <Button type="submit">Apply</Button>
            {hasFilters && (
              <Button variant="ghost" onClick={clear}>
                Clear
              </Button>
            )}
          </FilterBar>
        </form>
        <DataTable
          caption="Orders"
          rows={data}
          loading={loading}
          empty={hasFilters ? "No orders match these filters." : "No orders yet. They'll appear here as customers check out."}
          columns={[
            { key: "orderNumber", header: "Order", render: (o) => <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link> },
            { key: "createdAt", header: "Placed", render: (o) => formatDateTime(o.createdAt) },
            { key: "customer", header: "Customer", render: (o) => <><span className="font-medium">{o.customer.name || "—"}</span><br /><span className="text-xs text-muted">{o.customer.mobile}</span></> },
            { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
            { key: "paymentStatus", header: "Payment", render: (o) => <div className="flex flex-wrap items-center gap-1.5"><PaymentBadge status={o.paymentStatus} /><span className="text-xs text-muted">{o.paymentMethod === "cod" ? "COD" : "Online"}</span></div> },
            { key: "flags", header: "", render: (o) => o.flags.includes("invoice_pending") || o.flags.includes("late_payment") ? <Badge tone="warning">Needs attention</Badge> : null },
            { key: "grandPaise", header: "Total", align: "right", render: (o) => formatINR(o.grandPaise) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}
