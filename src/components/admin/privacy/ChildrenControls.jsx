"use client";

import { useState } from "react";
import { ActionError, StepUpNotice, statusLabel, useRun } from "@/components/admin/privacy/common";
import { DataTable, ErrorBanner, Modal, PageHeader, Panel, StatCard, formatDate } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";

const TONE = { pending: "info", verified: "success", rejected: "danger", withdrawn: "neutral", expired: "neutral" };

export default function ChildrenControls() {
  const { user } = useAuth();
  const canManage = user.permissions.includes("privacy.requests.manage");
  const { data, error, reload } = useAsync(() => admin.get("/privacy/children"), []);
  const [verify, setVerify] = useState(null);
  const [form, setForm] = useState({ reference: "", notes: "", validMonths: "12" });
  const { run, busy, reauth, error: actionError } = useRun();

  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const { stats, mode, verifiers, items } = data;

  async function submitVerify() {
    const out = await run(() => admin.post(`/privacy/children/${verify.id}/verify`, { method: "manual_review", reference: form.reference, notes: form.notes, validMonths: Number(form.validMonths) || 12 }), "Parent verified.");
    if (out) (setVerify(null), reload());
  }
  async function reject(id) {
    const out = await run(() => admin.post(`/privacy/children/${id}/reject`, {}), "Request rejected.");
    if (out) reload();
  }

  return (
    <>
      <PageHeader title="Children's data controls" description="A child is anyone under 18. Accounts that declare they are under 18 cannot order or receive marketing until a parent or guardian is verified." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Under-18 accounts" value={stats.minorDeclaredAccounts} />
        <StatCard label="Parent checks waiting" value={stats.pendingParentalRequests} tone={stats.pendingParentalRequests ? "warning" : "default"} />
        <StatCard label="Verified parental consents" value={stats.verifiedParentalConsents} />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Current mode">
          <p className="text-sm"><Badge tone={mode === "parental_consent" ? "info" : "neutral"}>{mode === "parental_consent" ? "Parental verification enabled" : "Adult-only accounts"}</Badge></p>
          <p className="mt-3 text-sm text-muted">
            {mode === "parental_consent"
              ? "Under-18 account holders can ask for a parent or guardian to be verified by staff. Orders unlock only after verification."
              : "Accounts are for adults. An account declared as under 18 is restricted (no orders, no marketing) and is told to ask a parent or guardian to order. No children's data is processed beyond that declaration."}
          </p>
          <p className="mt-3 text-sm text-muted">Change the mode in Privacy settings. Switching it on needs a written verification procedure and legal review first.</p>
        </Panel>
        <Panel title="Verification methods">
          <ul className="space-y-2 text-sm">
            {Object.entries(verifiers).map(([k, v]) => (
              <li key={k} className="flex items-start gap-2"><Badge tone={v.available ? "success" : "neutral"}>{v.available ? "Available" : "Not configured"}</Badge><span>{v.label}</span></li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">The Rules require due diligence that the parent is an identifiable adult, using reliable details already held or details the person provides directly or through a virtual token issued by an authorised entity. A tick-box is never accepted. Never record an Aadhaar or ID number here: only an opaque reference to how the check was done.</p>
        </Panel>
      </div>

      <Panel title="Parental consent records" padded={false}>
        <DataTable
          caption="Parental consent records"
          loading={false}
          rows={items}
          empty="No parental consent requests."
          columns={[
            { key: "childMobile", header: "Account", className: "tabular-nums" },
            { key: "parentName", header: "Parent or guardian" },
            { key: "parentMobileMasked", header: "Parent mobile", className: "tabular-nums" },
            { key: "status", header: "Status", render: (r) => <Badge tone={TONE[r.status]}>{statusLabel(r.status)}</Badge> },
            { key: "requestedAt", header: "Requested", render: (r) => formatDate(r.requestedAt) },
            { key: "expiresAt", header: "Valid until", render: (r) => formatDate(r.expiresAt) },
            { key: "actions", header: "", render: (r) => (canManage && r.status === "pending" ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => (setVerify(r), setForm({ reference: "", notes: "", validMonths: "12" }))}>Verify</Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => reject(r.id)}>Reject</Button>
              </div>
            ) : null) },
          ]}
        />
      </Panel>

      <Modal open={Boolean(verify)} title="Record parent verification" onClose={() => setVerify(null)} footer={<><Button variant="ghost" onClick={() => setVerify(null)}>Cancel</Button><Button onClick={submitVerify} loading={busy} disabled={!form.reference.trim()}>Mark verified</Button></>}>
        {reauth && <StepUpNotice />}
        <ActionError error={actionError} />
        <p className="mb-4 text-sm text-muted">Verify {verify?.parentName} by your approved procedure, then record a reference to how it was done (for example a case number). Do not enter any ID number.</p>
        <div className="space-y-4">
          <Field label="Verification reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Field label="Valid for (months)" inputMode="numeric" value={form.validMonths} onChange={(e) => setForm({ ...form, validMonths: e.target.value })} hint="1 to 24. The person is asked to renew after that." />
          <Field label="Notes" optional as="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>
    </>
  );
}
