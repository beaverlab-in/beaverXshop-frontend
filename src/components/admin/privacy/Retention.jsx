"use client";

import { useState } from "react";
import { ActionError, StepUpNotice, statusLabel, useRun } from "@/components/admin/privacy/common";
import { ConfirmDialog, DataTable, ErrorBanner, Modal, PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";

const ACTION = { delete: "Delete", anonymize: "Anonymise", review: "Review by hand", ttl: "Automatic expiry" };

function RunResult({ run }) {
  if (!run) return null;
  return (
    <div role="status" className="mb-4 rounded-md border border-line bg-subtle p-4 text-sm">
      <p className="font-semibold">{run.logs.some((l) => !l.dryRun) ? "Run finished" : "Preview (nothing was changed)"}</p>
      <ul className="mt-2 space-y-1">{run.logs.map((l) => <li key={l._id}><strong>{l.policyKey}</strong>: {l.count} record(s){l.dryRun ? " would be affected" : ""}{l.note ? ` · ${l.note}` : ""}</li>)}</ul>
    </div>
  );
}

export default function Retention() {
  const { data, error, reload } = useAsync(() => admin.get("/privacy/retention"), []);
  const logs = useAsync(() => admin.get("/privacy/retention/logs"), []);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [hold, setHold] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [confirmRun, setConfirmRun] = useState(false);
  const { run, busy, reauth, error: actionError } = useRun();

  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const { policies, holds } = data;

  const open = (p) => (setEdit(p), setForm({ retentionDays: p.retentionDays ?? "", enabled: p.enabled, notes: p.notes ?? "", markReviewed: false }));
  async function save() {
    const body = { notes: form.notes, enabled: form.enabled, markReviewed: form.markReviewed };
    if (edit.managed) body.retentionDays = form.retentionDays === "" ? null : Number(form.retentionDays);
    if (await run(() => admin.patch(`/privacy/retention/${edit.key}`, body), "Policy saved.")) (setEdit(null), reload());
  }
  async function preview() {
    const out = await run(() => admin.post("/privacy/retention/run", { dryRun: true }));
    if (out) (setRunResult(out), logs.reload());
  }
  async function runNow() {
    const out = await run(() => admin.post("/privacy/retention/run", { dryRun: false }), "Retention run finished.");
    setConfirmRun(false);
    if (out) (setRunResult(out), reload(), logs.reload());
  }
  async function placeHold() {
    if (await run(() => admin.post("/privacy/retention/holds", { scope: hold.scope, userId: hold.scope === "user" ? hold.userId : undefined, reason: hold.reason }), "Legal hold placed.")) (setHold(null), reload());
  }
  async function release(h) {
    if (await run(() => admin.del(`/privacy/retention/holds/${h._id}`), "Hold released.")) reload();
  }

  return (
    <>
      <PageHeader
        title="Data retention"
        description="How long each kind of data is kept. Every policy starts switched off and every period is a proposal for legal review. Orders and invoices are never deleted automatically."
        actions={<><Button variant="secondary" onClick={preview} loading={busy}>Preview a run</Button><Button onClick={() => setConfirmRun(true)}>Run enabled policies now</Button></>}
      />
      {reauth && <StepUpNotice />}
      <ActionError error={actionError} />
      <RunResult run={runResult} />

      <Panel padded={false}>
        <DataTable
          caption="Retention policies"
          loading={false}
          rows={policies}
          rowKey={(r) => r.key}
          onRowClick={open}
          columns={[
            { key: "label", header: "Data", render: (r) => <span className="font-medium">{r.label}</span> },
            { key: "retentionDays", header: "Period", render: (r) => (r.retentionDays ? `${r.retentionDays} days` : r.action === "ttl" ? "Expires automatically" : "While the purpose lasts") },
            { key: "minDays", header: "Legal floor", render: (r) => (r.minDays ? `${r.minDays} days` : "None set") },
            { key: "action", header: "Action", render: (r) => ACTION[r.action] },
            { key: "enabled", header: "Automatic", render: (r) => (r.managed && ["delete", "anonymize"].includes(r.action) ? <Badge tone={r.enabled ? "success" : "neutral"}>{r.enabled ? "On" : "Off"}</Badge> : <span className="text-muted">Not applicable</span>) },
            { key: "legalReviewRequired", header: "Legal review", render: (r) => <Badge tone={r.legalReviewRequired ? "warning" : "success"}>{r.legalReviewRequired ? "Needed" : "Done"}</Badge> },
            { key: "lastRunAt", header: "Last run", render: (r) => (r.lastRunAt ? `${formatDateTime(r.lastRunAt)} (${r.lastRunCount})` : "Never") },
          ]}
        />
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Legal holds" actions={<Button size="sm" variant="secondary" onClick={() => setHold({ scope: "user", userId: "", reason: "" })}>Place a hold</Button>}>
          <p className="mb-3 text-sm text-muted">A hold stops deletion and erasure. A hold on a customer protects that person&apos;s data; a hold on everything pauses every retention run.</p>
          {holds.length === 0 ? <p className="text-sm text-muted">No active holds.</p> : (
            <ul className="space-y-2 text-sm">
              {holds.map((h) => (
                <li key={h._id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-subtle p-3">
                  <span><Badge tone={h.scope === "all" ? "danger" : "warning"}>{h.scope === "all" ? "Everything" : "One customer"}</Badge> {h.reason} <span className="text-muted">· {formatDateTime(h.createdAt)}</span></span>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => release(h)}>Release</Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Deletion log (counts only)" padded={false}>
          <DataTable
            caption="Deletion log"
            loading={!logs.data}
            rows={logs.data}
            rowKey={(r) => r._id}
            empty="No runs yet."
            columns={[
              { key: "at", header: "When", render: (r) => formatDateTime(r.at) },
              { key: "policyKey", header: "Policy" },
              { key: "count", header: "Records", align: "right" },
              { key: "mode", header: "Mode", render: (r) => `${r.trigger.replaceAll("_", " ")}${r.dryRun ? ", preview" : ""}` },
            ]}
          />
        </Panel>
      </div>

      <Modal open={Boolean(edit)} title={edit?.label ?? ""} onClose={() => setEdit(null)} footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></>}>
        {edit && (
          <div className="space-y-4">
            <ActionError error={actionError} />
            <p className="text-sm text-muted">{edit.description}</p>
            <p className="text-sm"><strong>Basis:</strong> {edit.basis}</p>
            {edit.floorSource && <p className="rounded-md bg-subtle p-3 text-sm">Legal floor ({edit.minDays} days): {edit.floorSource}</p>}
            {edit.managed ? (
              <Field label="Retention period (days)" inputMode="numeric" value={form.retentionDays} onChange={(e) => setForm({ ...form, retentionDays: e.target.value })} hint={edit.minDays ? `Cannot be shorter than ${edit.minDays} days.` : "Leave blank for no automatic period."} />
            ) : <p className="text-sm text-muted">This period is enforced elsewhere (a Redis expiry) and cannot be edited here.</p>}
            {edit.managed && ["delete", "anonymize"].includes(edit.action) && (
              <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="mt-1 size-5 accent-brand" /><span>Run this automatically every day ({ACTION[edit.action].toLowerCase()} records older than the period).</span></label>
            )}
            <Field label="Notes" as="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={form.markReviewed} onChange={(e) => setForm({ ...form, markReviewed: e.target.checked })} className="mt-1 size-5 accent-brand" /><span>A legal professional has reviewed this period (clears the &ldquo;legal review needed&rdquo; flag).</span></label>
            <p className="text-xs text-muted">Current state: {edit.legalReviewRequired ? "legal review needed" : `reviewed ${formatDateTime(edit.reviewedAt)}`} · {statusLabel(edit.action)}</p>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(hold)} title="Place a legal hold" onClose={() => setHold(null)} footer={<><Button variant="ghost" onClick={() => setHold(null)}>Cancel</Button><Button onClick={placeHold} loading={busy} disabled={!hold?.reason || hold.reason.length < 5 || (hold.scope === "user" && !/^[a-f\d]{24}$/i.test(hold.userId))}>Place hold</Button></>}>
        {hold && (
          <div className="space-y-4">
            {reauth && <StepUpNotice />}
            <ActionError error={actionError} />
            <Field label="Applies to" as="select" value={hold.scope} onChange={(e) => setHold({ ...hold, scope: e.target.value })}>
              <option value="user">One customer</option>
              <option value="all">Everything (pauses all retention runs)</option>
            </Field>
            {hold.scope === "user" && <Field label="Customer id" value={hold.userId} onChange={(e) => setHold({ ...hold, userId: e.target.value.trim() })} hint="The 24-character id shown in the Customers page address bar." />}
            <Field label="Reason" as="textarea" value={hold.reason} onChange={(e) => setHold({ ...hold, reason: e.target.value })} />
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirmRun} title="Run retention now?" confirmLabel="Run now" busy={busy} danger message="Every policy that is switched on will delete or anonymise records older than its period, except for customers under a legal hold. A preview shows the counts first." onCancel={() => setConfirmRun(false)} onConfirm={runNow} />
    </>
  );
}
