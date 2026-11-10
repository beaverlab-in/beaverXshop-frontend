"use client";

import { useState } from "react";
import { DataTable, ErrorBanner, FilterBar, Modal, PageHeader, Pagination, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import useAdminList from "@/hooks/useAdminList";

const ENTITIES = ["", "product", "category", "order", "user", "coupon", "settings"];

export default function AuditLog() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const { data, meta, loading, error, reload } = useAdminList("/audit-logs", { entity, page });
  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of important admin actions. Entries can't be edited or deleted." />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <FilterBar>
          <label className="text-xs font-medium text-muted">Area
            <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="mt-1 block h-10 rounded-md border border-line bg-surface px-3 text-sm">
              {ENTITIES.map((e) => <option key={e} value={e}>{e || "Everything"}</option>)}
            </select>
          </label>
        </FilterBar>
        <DataTable
          caption="Audit log"
          rows={data}
          loading={loading}
          empty="Nothing recorded yet."
          columns={[
            { key: "at", header: "When", render: (r) => formatDateTime(r.at) },
            { key: "admin", header: "Who", render: (r) => r.admin?.name || "System" },
            { key: "action", header: "Action", render: (r) => <span className="font-medium">{r.action}</span> },
            { key: "entityId", header: "Record", render: (r) => <span className="font-mono text-xs">{r.entity} {r.entityId ?? ""}</span> },
            { key: "d", header: "", align: "right", render: (r) => (r.before || r.after) && <Button size="sm" variant="ghost" onClick={() => setDetail(r)}>Details</Button> },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
      <Modal open={Boolean(detail)} wide onClose={() => setDetail(null)} title={detail?.action ?? ""}>
        {detail && (
          <div className="grid gap-4 md:grid-cols-2">
            {["before", "after"].map((k) => (
              <div key={k}>
                <p className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{k === "before" ? "Before" : "After"}</p>
                <pre className="max-h-96 overflow-auto rounded-md bg-canvas p-3 text-xs">{detail[k] ? JSON.stringify(detail[k], null, 2) : "—"}</pre>
              </div>
            ))}
            <p className="text-xs text-muted md:col-span-2">Request id: {detail.requestId}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
