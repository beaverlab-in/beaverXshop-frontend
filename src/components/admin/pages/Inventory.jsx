"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { DataTable, ErrorBanner, FilterBar, Modal, PageHeader, Pagination, Panel, StatCard, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const LEVEL = { out: ["danger", "Out of stock"], low: ["warning", "Low"], ok: ["success", "In stock"] };
const sel = "h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25";

export default function Inventory() {
  const sp = useSearchParams();
  const toast = useToast();
  const { user } = useAuth();
  const canAdjust = user.permissions.includes("inventory:adjust");
  const [filter, setFilter] = useState(sp.get("filter") ?? "");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/inventory", { filter, q: query, page });
  const [adjust, setAdjust] = useState(null); // product row
  const [history, setHistory] = useState(null);
  const [form, setForm] = useState({ delta: "", note: "", reason: "adjustment" });
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const hist = useAdminList(`/inventory/${history?.id}/history`, {}, { enabled: Boolean(history) });

  async function save() {
    const delta = Number(form.delta);
    if (!Number.isInteger(delta) || delta === 0) return setFormError("Enter a whole number, positive to add stock or negative to remove it.");
    setBusy(true);
    setFormError("");
    try {
      await admin.post(`/inventory/${adjust.id}/adjust`, { delta, reason: form.reason, note: form.note });
      toast.success("Stock updated.");
      setAdjust(null);
      reload();
    } catch (e) {
      setFormError(e.fields ? Object.values(e.fields).join(" ") : e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Inventory" description="Every stock change is recorded with who made it and why. Stock can never go below zero." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <StatCard label="Low stock" value={meta?.lowStock ?? "…"} hint="At or below the alert level" tone={meta?.lowStock ? "warning" : "default"} />
        <StatCard label="Out of stock" value={meta?.outOfStock ?? "…"} hint="Customers can't buy these" tone={meta?.outOfStock ? "danger" : "default"} />
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); setPage(1); }}>
          <FilterBar>
            <label className="min-w-52 flex-1 text-xs font-medium text-muted">Search<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or SKU" className={`${sel} mt-1 w-full`} /></label>
            <label className="text-xs font-medium text-muted">Show
              <select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} className={`${sel} mt-1 block`}><option value="">All products</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
            </label>
            <Button type="submit">Search</Button>
          </FilterBar>
        </form>
        <DataTable
          caption="Inventory"
          rows={data}
          loading={loading}
          empty="No products match."
          columns={[
            { key: "title", header: "Product", render: (p) => <><span className="font-semibold">{p.title}</span><br /><span className="text-xs text-muted">{p.sku}{p.status !== "published" ? ` · ${p.status}` : ""}</span></> },
            { key: "level", header: "Level", render: (p) => <Badge tone={LEVEL[p.level][0]}>{LEVEL[p.level][1]}</Badge> },
            { key: "stock", header: "In stock", align: "right", render: (p) => <strong>{p.stock}</strong> },
            { key: "lowStockThreshold", header: "Alert at", align: "right" },
            { key: "actions", header: "", align: "right", render: (p) => (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="ghost" onClick={() => setHistory(p)}>History</Button>
                {canAdjust && <Button size="sm" variant="secondary" onClick={() => { setForm({ delta: "", note: "", reason: "adjustment" }); setFormError(""); setAdjust(p); }}>Adjust</Button>}
              </div>
            ) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>

      <Modal open={Boolean(adjust)} onClose={() => setAdjust(null)} title={`Adjust stock: ${adjust?.title ?? ""}`}
        footer={<><Button variant="ghost" onClick={() => setAdjust(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={save}>Save change</Button></>}>
        <p className="mb-4 text-sm text-muted">Currently <strong>{adjust?.stock}</strong> in stock.</p>
        <div className="space-y-4">
          <Field label="Change" inputMode="numeric" placeholder="+10 or -2" value={form.delta} onChange={(e) => setForm({ ...form, delta: e.target.value.replace(/[^\d-]/g, "") })} hint="Positive adds stock, negative removes it." />
          <Field as="select" label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}><option value="adjustment">Stock count / correction / received</option><option value="return">Customer return put back on the shelf</option></Field>
          <Field as="textarea" label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} hint="Kept in the history, e.g. “Received 40 units from supplier”." className="[&_textarea]:!min-h-20" />
          {formError && <p role="alert" className="text-sm font-medium text-danger">{formError}</p>}
        </div>
      </Modal>

      <Modal open={Boolean(history)} onClose={() => setHistory(null)} wide title={`Stock history: ${history?.title ?? ""}`}>
        <DataTable
          caption="Stock history"
          rows={hist.data}
          loading={hist.loading}
          empty="No stock movements yet."
          columns={[
            { key: "at", header: "When", render: (r) => formatDateTime(r.at) },
            { key: "delta", header: "Change", align: "right", render: (r) => <span className={r.delta < 0 ? "text-danger" : "text-success"}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span> },
            { key: "balanceAfter", header: "Balance", align: "right" },
            { key: "reason", header: "Reason", render: (r) => r.reason.replace("_", " ") },
            { key: "note", header: "Note", render: (r) => r.note || r.refId || "—" },
          ]}
        />
      </Modal>
    </>
  );
}
