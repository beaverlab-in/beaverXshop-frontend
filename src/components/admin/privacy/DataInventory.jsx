"use client";

import { useState } from "react";
import { ActionError, Info, useRun } from "@/components/admin/privacy/common";
import { DataTable, ErrorBanner, Modal, PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";

const TONE = { unreviewed: "neutral", reviewed: "success", needs_legal_review: "warning" };
const LABEL = { unreviewed: "Unreviewed", reviewed: "Reviewed", needs_legal_review: "Needs legal review" };

/** The audited map of personal data: what, why, where, who can see it, how long, and on what basis. */
export default function DataInventory() {
  const { user } = useAuth();
  const canEdit = user.permissions.includes("privacy.settings.manage");
  const { data, error, reload } = useAsync(() => admin.get("/privacy/inventory"), []);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({ reviewStatus: "reviewed", notes: "" });
  const { run, busy, error: actionError } = useRun();

  async function save() {
    const ok = await run(() => admin.patch(`/privacy/inventory/${open.key}`, form), "Review recorded.");
    if (ok) (setOpen(null), reload());
  }

  return (
    <>
      <PageHeader title="Data inventory" description="Every personal data field the system handles, from an audit of the code. Mark items reviewed once a lawyer or your privacy contact has checked them." />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <DataTable
          caption="Personal data inventory"
          loading={!data}
          rows={data}
          rowKey={(r) => r.key}
          onRowClick={(r) => (setOpen(r), setForm({ reviewStatus: r.reviewStatus === "needs_legal_review" ? "reviewed" : r.reviewStatus, notes: r.notes ?? "" }))}
          columns={[
            { key: "category", header: "Area", className: "whitespace-nowrap" },
            { key: "field", header: "Data", render: (r) => <span className="font-medium">{r.field}</span> },
            { key: "store", header: "Stored in", className: "max-w-xs text-muted" },
            { key: "processors", header: "Shared with", render: (r) => (r.processors.length ? r.processors.join(", ") : "Nobody") },
            { key: "retentionPolicyKey", header: "Retention", render: (r) => r.retentionPolicyKey ?? "n/a" },
            { key: "reviewStatus", header: "Review", render: (r) => <Badge tone={TONE[r.reviewStatus]}>{LABEL[r.reviewStatus]}</Badge> },
          ]}
        />
      </Panel>

      <Modal
        open={Boolean(open)}
        title={open?.field ?? ""}
        onClose={() => setOpen(null)}
        wide
        footer={canEdit ? (<><Button variant="ghost" onClick={() => setOpen(null)}>Close</Button><Button onClick={save} loading={busy}>Save review</Button></>) : <Button variant="secondary" onClick={() => setOpen(null)}>Close</Button>}
      >
        {open && (
          <>
            <ActionError error={actionError} />
            <dl className="grid gap-4 sm:grid-cols-2">
              <Info label="Why it is collected">{open.purposeText}</Info>
              <Info label="Where it is collected">{open.collectedVia}</Info>
              <Info label="Where it is stored">{open.store}</Info>
              <Info label="Processed by">{open.processors.join(", ") || "Nobody outside BeaverLab"}</Info>
              <Info label="Who can access it">{open.accessRoles.join("; ")}</Info>
              <Info label="Retention policy">{open.retentionPolicyKey}</Info>
              <Info label="Lawful basis (to be confirmed by counsel)">{open.lawfulBasis}</Info>
              <Info label="How the person exercises their rights">{open.rightsRoute}</Info>
              <Info label="Notes">{open.notes}</Info>
              <Info label="Last review">{open.reviewedAt ? formatDateTime(open.reviewedAt) : ""}</Info>
            </dl>
            {canEdit && (
              <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                <Field label="Review status" as="select" value={form.reviewStatus} onChange={(e) => setForm({ ...form, reviewStatus: e.target.value })}>
                  {Object.entries(LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Field>
                <Field label="Review notes" as="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="sm:col-span-2" />
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
}
