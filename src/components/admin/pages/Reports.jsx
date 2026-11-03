"use client";

import { useState } from "react";
import RangePicker from "@/components/admin/RangePicker";
import { DataTable, ErrorBanner, PageHeader, Panel, Tabs } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import { DownloadIcon } from "@/components/ui/Icons";
import useAdminList from "@/hooks/useAdminList";
import { downloadAdminFile, qs } from "@/lib/client/adminApi";
import { formatINR } from "@/lib/money";
import { useToast } from "@/providers/ToastProvider";

const TABS = [
  { value: "sales", label: "Sales", about: "Orders placed per day (excluding cancelled and unpaid), with tax, shipping and discounts." },
  { value: "orders", label: "Orders", about: "One row per order in the period, including cancelled ones." },
  { value: "products", label: "Product performance", about: "Units and revenue per product for non-cancelled orders." },
  { value: "inventory", label: "Inventory", about: "Current stock levels (not date-bound)." },
  { value: "gst", label: "GST summary", about: "From issued invoices, grouped by HSN/SAC, rate and supply type. Give this to your tax professional; it is not a filing." },
  { value: "refunds", label: "Refunds", about: "Every refund made in the period." },
  { value: "customers", label: "Customers", about: "Customers with orders in the period, by spend." },
];

export default function Reports() {
  const toast = useToast();
  const [type, setType] = useState("sales");
  const [range, setRange] = useState({ preset: "30d" });
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useAdminList(`/reports/${type}`, range);
  const tab = TABS.find((t) => t.value === type);

  const columns = (data?.columns ?? []).map((c) => ({
    key: c.key,
    header: c.label,
    align: c.kind === "money" || /^(orders|qty|stock|lowStockThreshold)$/.test(c.key) ? "right" : undefined,
    render: (r) => (c.kind === "money" ? formatINR(r[c.key]) : r[c.key]),
  }));

  async function exportCsv() {
    setBusy(true);
    try {
      await downloadAdminFile(`/reports/${type}${qs({ ...range, format: "csv" })}`, `report-${type}.csv`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const rows = data?.rows;
  return (
    <>
      <PageHeader title="Reports" description="Download any report as a spreadsheet-ready CSV." actions={<Button variant="secondary" onClick={exportCsv} loading={busy}><DownloadIcon className="size-4" /> Export CSV</Button>} />
      <Tabs tabs={TABS} value={type} onChange={setType} label="Reports" />
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted">{tab.about}</p>
        {type !== "inventory" && <RangePicker value={range} onChange={setRange} />}
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <DataTable caption={tab.label} columns={columns} rows={rows} loading={loading} rowKey={(r) => JSON.stringify(r)} empty="No data in this period." />
        {data && rows.length > 0 && Object.keys(data.totals).length > 0 && (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 border-t border-line bg-subtle px-5 py-4 text-sm">
            {data.columns.filter((c) => c.kind === "money").map((c) => (
              <div key={c.key}><dt className="text-xs text-muted">Total {c.label.toLowerCase()}</dt><dd className="font-bold tabular-nums">{formatINR(data.totals[c.key])}</dd></div>
            ))}
          </dl>
        )}
      </Panel>
    </>
  );
}
