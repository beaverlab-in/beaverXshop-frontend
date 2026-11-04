"use client";

import { useState } from "react";
import { PURPOSE_LABELS } from "@/components/admin/privacy/common";
import { DataTable, ErrorBanner, FilterBar, PageHeader, Pagination, Panel, formatDateTime } from "@/components/admin/ui";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";

/** Read-only evidence of consent: who agreed to what, on which notice version, and when it was withdrawn. Mobile numbers are masked. */
export default function ConsentRecords() {
  const [filters, setFilters] = useState({ purpose: "", status: "" });
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/privacy/consents", { ...filters, page });
  const set = (k) => (e) => (setFilters({ ...filters, [k]: e.target.value }), setPage(1));
  return (
    <>
      <PageHeader title="Consent records" description="Each row is one grant. Withdrawing sets the withdrawal time; the record is kept as evidence." />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <FilterBar>
          <Field label="Purpose" as="select" value={filters.purpose} onChange={set("purpose")} className="w-56">
            <option value="">All</option>
            {Object.entries(PURPOSE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Field>
          <Field label="Status" as="select" value={filters.status} onChange={set("status")} className="w-44">
            <option value="">All</option>
            <option value="granted">Active</option>
            <option value="withdrawn">Withdrawn</option>
          </Field>
        </FilterBar>
        <DataTable
          caption="Consent records"
          loading={loading}
          rows={data}
          empty="No consent records yet. Nothing is pre-ticked, so this stays empty until customers opt in."
          columns={[
            { key: "mobile", header: "Customer", className: "tabular-nums" },
            { key: "purposeKey", header: "Purpose", render: (r) => PURPOSE_LABELS[r.purposeKey] ?? r.purposeKey },
            { key: "channel", header: "Channel" },
            { key: "status", header: "Status", render: (r) => <Badge tone={r.status === "granted" ? "success" : "neutral"}>{r.status === "granted" ? "Active" : "Withdrawn"}</Badge> },
            { key: "noticeVersion", header: "Notice", align: "right" },
            { key: "source", header: "Given at" },
            { key: "grantedAt", header: "Granted", render: (r) => formatDateTime(r.grantedAt) },
            { key: "withdrawnAt", header: "Withdrawn", render: (r) => formatDateTime(r.withdrawnAt) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}
