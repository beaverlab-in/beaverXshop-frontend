"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, ErrorBanner, FilterBar, PageHeader, Pagination, Panel } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { formatINR } from "@/lib/money";
import { useAuth } from "@/providers/AuthProvider";

const sel = "h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25";
const TONE = { published: "success", draft: "warning", archived: "neutral" };

export default function Products() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", category: "" });
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/products", { ...filters, page });
  const cats = useAdminList("/categories");
  const names = new Map((cats.data ?? []).map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader
        title="Products"
        description="Everything you sell. Archive instead of deleting: past orders keep referring to their products."
        actions={user.permissions.includes("products:write") && <Button href="/admin/products/new">New product</Button>}
      />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <form onSubmit={(e) => { e.preventDefault(); setFilters({ ...filters, q }); setPage(1); }}>
          <FilterBar>
            <label className="min-w-52 flex-1 text-xs font-medium text-muted">
              Search
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or SKU" className={`${sel} mt-1 w-full`} />
            </label>
            <label className="text-xs font-medium text-muted">
              Status
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className={`${sel} mt-1 block`}>
                <option value="">All</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option>
              </select>
            </label>
            <label className="text-xs font-medium text-muted">
              Category
              <select value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }} className={`${sel} mt-1 block`}>
                <option value="">All</option>
                {(cats.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <Button type="submit">Search</Button>
          </FilterBar>
        </form>
        <DataTable
          caption="Products"
          rows={data}
          loading={loading}
          empty="No products yet. Create a category first, then add your first product."
          onRowClick={(p) => router.push(`/admin/products/${p.id}`)}
          columns={[
            { key: "title", header: "Product", render: (p) => <><Link href={`/admin/products/${p.id}`} className="font-semibold text-brand hover:underline" onClick={(e) => e.stopPropagation()}>{p.title}</Link><br /><span className="text-xs text-muted">{p.sku}</span></> },
            { key: "categoryId", header: "Category", render: (p) => names.get(p.categoryId) ?? "—" },
            { key: "status", header: "Status", render: (p) => <Badge tone={TONE[p.status]}>{p.status}</Badge> },
            { key: "stock", header: "Stock", align: "right", render: (p) => <span className={p.stock <= 0 ? "font-semibold text-danger" : p.stock <= p.lowStockThreshold ? "font-semibold text-[#8a5a00]" : ""}>{p.stock}</span> },
            { key: "pricePaise", header: "Price", align: "right", render: (p) => formatINR(p.pricePaise) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}
