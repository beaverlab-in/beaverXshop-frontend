"use client";

import Link from "next/link";
import { useState } from "react";
import RangePicker from "@/components/admin/RangePicker";
import { BarChart, DataTable, ErrorBanner, PageHeader, Panel, StatCard, formatDateTime } from "@/components/admin/ui";
import { PaymentBadge, StatusBadge } from "@/components/account/OrderBits";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import { formatINR } from "@/lib/money";
import { useAuth } from "@/providers/AuthProvider";

export default function Dashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState({ preset: "30d" });
  const allowed = user.permissions.includes("dashboard:read");
  const { data, error, loading, reload } = useAdminList("/dashboard", range, { enabled: allowed });

  if (!allowed) {
    return (
      <>
        <PageHeader title={`Welcome${user.name ? `, ${user.name.split(" ")[0]}` : ""}`} description="Use the menu to get to the areas your role can manage." />
      </>
    );
  }
  const k = data?.kpis;
  const label = { today: "today", "7d": "the last 7 days", "30d": "the last 30 days", month: "this month", custom: "the selected dates" }[range.preset];

  return (
    <>
      <PageHeader title="Dashboard" description={`Business at a glance for ${label}.`} actions={<RangePicker value={range} onChange={setRange} />} />
      <ErrorBanner error={error} onRetry={reload} />

      {!k ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue (paid orders)" value={formatINR(k.revenuePaise)} hint="Online paid + COD cash collected" />
            <StatCard label="Orders" value={k.orders} hint="Placed, not cancelled" />
            <StatCard label="Customers" value={k.customers} hint="All accounts" />
            <StatCard label="Products" value={k.products} hint="Excluding archived" />
            <StatCard label="Pending orders" value={k.pendingOrders} hint="Confirmed, not started" tone={k.pendingOrders ? "warning" : "default"} href="/admin/orders?status=confirmed" />
            <StatCard label="Processing" value={k.processingOrders} hint="Processing or packed" href="/admin/orders?status=processing" />
            <StatCard label="Delivered" value={k.deliveredOrders} hint={`In ${label}`} href="/admin/orders?status=delivered" />
            <StatCard label="Low stock" value={k.lowStockProducts} hint="At or below threshold" tone={k.lowStockProducts ? "danger" : "default"} href="/admin/inventory?filter=low" />
          </div>
          {k.codToCollectOrders > 0 && (
            <p className="mt-4 rounded-md bg-subtle p-3 text-sm">
              <strong>{formatINR(k.codToCollectPaise)}</strong> of cash on delivery is still to be collected across {k.codToCollectOrders} order{k.codToCollectOrders === 1 ? "" : "s"}. It counts as revenue once marked collected.
            </p>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Panel title="Revenue by day">
              {k.revenuePaise === 0 && k.orders === 0 ? <p className="py-10 text-center text-muted">No sales in this period yet.</p> : <BarChart data={data.revenueSeries} />}
            </Panel>
            <Panel title="Best sellers">
              {data.bestSellers.length === 0 ? (
                <p className="py-6 text-center text-muted">Nothing sold in this period.</p>
              ) : (
                <ol className="space-y-3">
                  {data.bestSellers.map((b, i) => (
                    <li key={b.slug} className="flex items-center gap-3">
                      <span className="grid size-7 place-items-center rounded-full bg-subtle text-xs font-bold text-brand">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{b.title}</span>
                      <span className="text-sm text-muted tabular-nums">{b.qty} sold</span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
            <Panel title="Recent orders" padded={false} actions={<Link href="/admin/orders" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">View all</Link>}>
              <DataTable
                caption="Recent orders"
                rows={data.recentOrders}
                empty="No orders yet."
                columns={[
                  { key: "orderNumber", header: "Order", render: (o) => <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link> },
                  { key: "customer", header: "Customer" },
                  { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
                  { key: "paymentStatus", header: "Payment", render: (o) => <PaymentBadge status={o.paymentStatus} /> },
                  { key: "grandPaise", header: "Total", align: "right", render: (o) => formatINR(o.grandPaise) },
                ]}
              />
            </Panel>
            <Panel title="Recent activity">
              {data.recentActivity.length === 0 ? (
                <p className="py-6 text-center text-muted">No admin activity yet.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {data.recentActivity.map((a) => (
                    <li key={a.id}>
                      <p className="font-medium">{a.action.replace(".", " · ").replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted">
                        {a.admin || "System"} · {formatDateTime(a.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}
    </>
  );
}
