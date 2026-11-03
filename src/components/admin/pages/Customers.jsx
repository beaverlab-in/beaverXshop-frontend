"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog, DataTable, ErrorBanner, FilterBar, PageHeader, Pagination, Panel, formatDate, formatDateTime } from "@/components/admin/ui";
import { AddressBadges, AddressText } from "@/components/account/AddressBits";
import { PaymentBadge, StatusBadge } from "@/components/account/OrderBits";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { formatINR } from "@/lib/money";
import { formatMobile } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const sel = "h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25";

export function Customers() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "" });
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/customers", { ...filters, page });
  return (
    <>
      <PageHeader title="Customers" description="Everyone with an account. Customers are created automatically when they first log in with their mobile number." />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <form onSubmit={(e) => { e.preventDefault(); setFilters({ ...filters, q }); setPage(1); }}>
          <FilterBar>
            <label className="min-w-52 flex-1 text-xs font-medium text-muted">Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Mobile, name or email" className={`${sel} mt-1 w-full`} /></label>
            <label className="text-xs font-medium text-muted">Status
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className={`${sel} mt-1 block`}><option value="">All</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
            </label>
            <Button type="submit">Search</Button>
          </FilterBar>
        </form>
        <DataTable
          caption="Customers"
          rows={data}
          loading={loading}
          empty="No customers yet."
          onRowClick={(c) => router.push(`/admin/customers/${c.id}`)}
          columns={[
            { key: "name", header: "Customer", render: (c) => <><Link href={`/admin/customers/${c.id}`} className="font-semibold text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{c.name || "No name yet"}</Link><br /><span className="text-xs text-muted">{formatMobile(c.mobile)}</span></> },
            { key: "status", header: "Status", render: (c) => <div className="flex gap-1.5"><Badge tone={c.status === "active" ? "success" : "danger"}>{c.status}</Badge>{c.isStaff && <Badge tone="info">Staff</Badge>}</div> },
            { key: "orders", header: "Orders", align: "right" },
            { key: "totalSpentPaise", header: "Total spent", align: "right", render: (c) => formatINR(c.totalSpentPaise) },
            { key: "joinedAt", header: "Joined", render: (c) => formatDate(c.joinedAt) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}

export function CustomerDetail({ id }) {
  const toast = useToast();
  const { user } = useAuth();
  const { data: c, error, reload } = useAdminList(`/customers/${id}`);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!c) return error ? <ErrorBanner error={error} onRetry={reload} /> : <Skeleton className="h-96" />;
  const blocked = c.status === "blocked";

  async function toggle() {
    setBusy(true);
    try {
      await admin.patch(`/customers/${id}`, { status: blocked ? "active" : "blocked" });
      toast.success(blocked ? "Customer unblocked." : "Customer blocked and logged out.");
      setConfirm(false);
      reload();
    } catch (e) {
      toast.error(e.message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title={c.name || "Customer"} description={`${formatMobile(c.mobile)}${c.email ? ` · ${c.email}` : ""} · joined ${formatDate(c.joinedAt)}`}
        actions={<>
          <Badge tone={blocked ? "danger" : "success"}>{c.status}</Badge>
          {user.permissions.includes("customers:block") && !c.isStaff && <Button variant={blocked ? "secondary" : "danger"} size="sm" onClick={() => setConfirm(true)}>{blocked ? "Unblock" : "Block"}</Button>}
        </>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Panel><p className="text-sm text-muted">Orders</p><p className="text-3xl font-bold tabular-nums">{c.orders}</p></Panel>
        <Panel><p className="text-sm text-muted">Total spent</p><p className="text-3xl font-bold tabular-nums">{formatINR(c.totalSpentPaise)}</p></Panel>
        <Panel><p className="text-sm text-muted">Last login</p><p className="text-lg font-bold">{c.lastLoginAt ? formatDateTime(c.lastLoginAt) : "Never"}</p></Panel>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Recent orders" padded={false}>
          <DataTable caption="Orders" rows={c.recentOrders} empty="No orders yet." columns={[
            { key: "orderNumber", header: "Order", render: (o) => <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand hover:underline">{o.orderNumber}</Link> },
            { key: "createdAt", header: "Placed", render: (o) => formatDate(o.createdAt) },
            { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status} /> },
            { key: "paymentStatus", header: "Payment", render: (o) => <PaymentBadge status={o.paymentStatus} /> },
            { key: "grandPaise", header: "Total", align: "right", render: (o) => formatINR(o.grandPaise) },
          ]} />
        </Panel>
        <Panel title="Saved addresses">
          {c.addresses.length === 0 ? <p className="text-sm text-muted">No saved addresses.</p> : (
            <ul className="space-y-4">{c.addresses.map((a) => <li key={a.id}><AddressBadges address={a} /><div className="mt-2"><AddressText address={a} /></div></li>)}</ul>
          )}
        </Panel>
      </div>
      <ConfirmDialog open={confirm} danger={!blocked} title={blocked ? "Unblock this customer?" : "Block this customer?"} confirmLabel={blocked ? "Unblock" : "Block"} busy={busy} onCancel={() => setConfirm(false)} onConfirm={toggle}
        message={blocked ? "They will be able to log in and order again." : "They are logged out of every device immediately and can't log in or place orders until unblocked. Existing orders are not affected."} />
    </>
  );
}
