"use client";

import { useState } from "react";
import { useRun } from "@/components/admin/privacy/common";
import { DataTable, ErrorBanner, FilterBar, PageHeader, Pagination, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";

/** The privacy audit trail: append-only and hash-chained, so a removed or edited entry is detectable. It holds ids and counts, never personal data. */
export default function PrivacyAudit() {
  const [filters, setFilters] = useState({ entity: "", action: "" });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const { run, busy } = useRun();
  const { data, meta, loading, error, reload } = useAdminList("/privacy/audit", { ...filters, page });
  const set = (k) => (e) => (setFilters({ ...filters, [k]: e.target.value }), setPage(1));
  return (
    <>
      <PageHeader
        title="Privacy audit trail"
        description="Who did what to which privacy record. Entries are chained with hashes: editing or deleting one breaks the chain."
        actions={<Button variant="secondary" loading={busy} onClick={async () => setResult(await run(() => admin.get("/privacy/audit/verify")))}>Verify integrity</Button>}
      />
      {result && (
        <p role="status" className={`mb-4 rounded-md p-3 text-sm font-medium ${result.ok ? "bg-success/10 text-success-ink" : "bg-danger/10 text-danger-ink"}`}>
          {result.ok ? `The chain is intact (${result.checked} entries checked).` : `The chain is BROKEN at entry ${result.brokenAt}. Treat this as a security incident.`}
        </p>
      )}
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <FilterBar>
          <Field label="Record type" value={filters.entity} onChange={set("entity")} placeholder="privacy_request, consent, user…" className="w-64" />
          <Field label="Action starts with" value={filters.action} onChange={set("action")} placeholder="request., consent., incident." className="w-64" />
        </FilterBar>
        <DataTable
          caption="Privacy audit trail"
          loading={loading}
          rows={data}
          rowKey={(r) => r.seq}
          empty="No entries yet."
          columns={[
            { key: "seq", header: "#", align: "right" },
            { key: "at", header: "When", render: (r) => formatDateTime(r.at) },
            { key: "actorType", header: "By", render: (r) => <Badge tone={r.actorType === "admin" ? "info" : "neutral"}>{r.actorType}</Badge> },
            { key: "action", header: "Action", render: (r) => <span className="font-mono text-xs">{r.action}</span> },
            { key: "entity", header: "Record", render: (r) => `${r.entity ?? ""} ${r.entityId ?? ""}` },
            { key: "meta", header: "Details", render: (r) => (r.meta ? <span className="font-mono text-xs text-muted">{JSON.stringify(r.meta)}</span> : "") },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}
