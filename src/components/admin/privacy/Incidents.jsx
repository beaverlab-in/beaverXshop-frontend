"use client";

import { useState } from "react";
import { ActionError, Info, StepUpNotice, statusLabel, useRun } from "@/components/admin/privacy/common";
import { ConfirmDialog, DataTable, ErrorBanner, FilterBar, Modal, PageHeader, Pagination, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const SEVERITY_TONE = { low: "neutral", medium: "info", high: "warning", critical: "danger" };
const STATUS_TONE = { reported: "warning", investigating: "info", contained: "info", pending_notification_approval: "warning", notified: "success", closed: "neutral" };
const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const localNow = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function IncidentDetail({ id, onClose, onChanged }) {
  const { user } = useAuth();
  const canApprove = user.permissions.includes("privacy.incidents.approve");
  const { data: i, error, reload } = useAsync(() => admin.get(`/privacy/incidents/${id}`), [id]);
  const toast = useToast();
  const { run, busy, reauth, error: actionError } = useRun();
  const [fields, setFields] = useState(null);
  const [remed, setRemed] = useState("");
  const [doc, setDoc] = useState({ name: "", reference: "" });
  const [mobiles, setMobiles] = useState("");
  const [notice, setNotice] = useState(null);
  const [board, setBoard] = useState({ reference: "" });
  const [confirmSend, setConfirmSend] = useState(false);
  const base = `/privacy/incidents/${id}`;
  const done = async (fn, msg) => {
    const out = await run(fn, msg);
    if (out !== undefined) (reload(), onChanged());
    return out;
  };

  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!i) return <Skeleton className="h-64" />;
  const f = fields ?? { containment: i.containment ?? "", evidenceNotes: i.evidenceNotes ?? "", severity: i.severity, estimatedAffected: String(i.estimatedAffected ?? 0) };
  const closed = i.status === "closed";
  const draft = notice ?? (i.principalNotice.draftText || i.templates.principalNotice);

  return (
    <div className="space-y-6">
      {reauth && <StepUpNotice />}
      <ActionError error={actionError} />
      <dl className="grid gap-4 sm:grid-cols-3">
        <Info label="Incident">{i.incidentId}</Info>
        <Info label="Status"><Badge tone={STATUS_TONE[i.status]}>{statusLabel(i.status)}</Badge></Info>
        <Info label="Severity"><Badge tone={SEVERITY_TONE[i.severity]}>{i.severity}</Badge></Info>
        <Info label="Discovered (the 72-hour clock starts here)">{formatDateTime(i.discoveredAt)}</Info>
        <Info label="Occurred">{formatDateTime(i.occurredAt)}</Info>
        <Info label="Affected (identified / estimated)">{i.affectedCount} / {i.estimatedAffected}</Info>
        <Info label="Systems">{i.systems.join(", ")}</Info>
        <Info label="Data exposed">{i.dataTypes.join(", ")}</Info>
        <Info label="Reported by"><span className="text-muted">staff account</span></Info>
      </dl>
      <p className="whitespace-pre-line text-sm">{i.description}</p>

      {!closed && (
        <section aria-labelledby="inc-st" className="flex flex-wrap items-center gap-2">
          <h3 id="inc-st" className="text-sm font-semibold">Move to</h3>
          {["investigating", "contained", "closed"].filter((s) => s !== i.status).map((to) => (
            <Button key={to} size="sm" variant="secondary" disabled={busy} onClick={() => done(() => admin.post(`${base}/status`, { to }), `Status: ${statusLabel(to)}.`)}>{statusLabel(to)}</Button>
          ))}
        </section>
      )}

      <section aria-labelledby="inc-board" className="border-t border-line pt-5">
        <h3 id="inc-board" className="mb-2 text-sm font-semibold">Data Protection Board</h3>
        <p className={`text-sm ${i.boardDetailedOverdue ? "font-semibold text-danger" : "text-muted"}`}>
          Initial intimation (without delay): {i.board.initialSentAt ? `recorded ${formatDateTime(i.board.initialSentAt)}` : "not recorded"}. Detailed report due {formatDateTime(i.board.detailedDueAt)} (72 hours after becoming aware, unless the Board allows longer on your written request): {i.board.detailedSentAt ? `recorded ${formatDateTime(i.board.detailedSentAt)}` : i.boardDetailedOverdue ? "OVERDUE" : "not recorded"}.
        </p>
        {!closed && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <Field label="Board reference (optional)" value={board.reference} onChange={(e) => setBoard({ reference: e.target.value })} className="w-64" />
            <Button size="sm" variant="secondary" disabled={busy || Boolean(i.board.initialSentAt)} onClick={() => done(() => admin.post(`${base}/board`, { step: "initial", reference: board.reference || undefined }), "Initial intimation recorded.")}>Record initial intimation</Button>
            <Button size="sm" variant="secondary" disabled={busy || !i.board.initialSentAt || Boolean(i.board.detailedSentAt)} onClick={() => done(() => admin.post(`${base}/board`, { step: "detailed", reference: board.reference || undefined }), "Detailed report recorded.")}>Record detailed report</Button>
          </div>
        )}
        <details className="mt-3 text-sm"><summary className="cursor-pointer font-medium text-brand">Board report outline (template)</summary><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-subtle p-3 text-xs">{i.templates.boardReport}</pre></details>
        <p className="mt-2 text-xs text-muted">You file with the Board through its official channel. This page records that you did and when.</p>
      </section>

      <section aria-labelledby="inc-affected" className="border-t border-line pt-5">
        <h3 id="inc-affected" className="mb-2 text-sm font-semibold">Affected people</h3>
        {!closed && i.principalNotice.status !== "sent" ? (
          <>
            <Field label="Mobile numbers (one per line)" as="textarea" value={mobiles} onChange={(e) => setMobiles(e.target.value)} hint="Numbers that match an active account. Others are counted so you can follow up another way." />
            <Button size="sm" variant="secondary" className="mt-2" disabled={busy || !mobiles.trim()} onClick={async () => { const out = await run(() => admin.post(`${base}/affected`, { mobiles: mobiles.split(/[\s,]+/).filter(Boolean) })); if (out) { reload(); onChanged(); setMobiles(""); if (out.notFound) toast.info(`${out.notFound} number(s) did not match an active account.`); } }}>Save affected people</Button>
          </>
        ) : <p className="text-sm text-muted">{i.affectedCount} account(s).</p>}
      </section>

      <section aria-labelledby="inc-notice" className="border-t border-line pt-5">
        <h3 id="inc-notice" className="mb-1 text-sm font-semibold">Notice to affected people</h3>
        <p className="mb-2 text-sm text-muted">Status: <Badge tone={i.principalNotice.status === "sent" ? "success" : i.principalNotice.status === "none" ? "neutral" : "warning"}>{statusLabel(i.principalNotice.status)}</Badge>. Nothing is ever sent automatically: write the notice, have a second authorised person approve it, then send. It appears in each affected person&apos;s account and a short message tells them to look.</p>
        {i.principalNotice.status !== "sent" && !closed && (
          <>
            <Field label="Notice text (replace every [bracketed] part)" as="textarea" value={draft} onChange={(e) => setNotice(e.target.value)} className="[&_textarea]:!min-h-56" />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => done(() => admin.post(`${base}/notice/prepare`, { text: draft }), "Sent for approval.")}>Save and send for approval</Button>
              {canApprove && i.principalNotice.status === "pending_approval" && <Button size="sm" disabled={busy} onClick={() => done(() => admin.post(`${base}/notice/approve`), "Notice approved.")}>Approve notice</Button>}
              {canApprove && i.principalNotice.status === "approved" && <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmSend(true)}>Send to {i.affectedCount} account(s)</Button>}
            </div>
          </>
        )}
        {i.principalNotice.status === "sent" && <p className="mt-2 text-sm">Sent {formatDateTime(i.principalNotice.sentAt)} to {i.principalNotice.sentCount} account(s).</p>}
      </section>

      {!closed && (
        <section aria-labelledby="inc-work" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
          <h3 id="inc-work" className="text-sm font-semibold sm:col-span-2">Investigation record</h3>
          <Field label="Containment: what was done to secure the systems" as="textarea" value={f.containment} onChange={(e) => setFields({ ...f, containment: e.target.value })} />
          <Field label="Evidence preserved (what and where, never the data itself)" as="textarea" value={f.evidenceNotes} onChange={(e) => setFields({ ...f, evidenceNotes: e.target.value })} />
          <Field label="Severity" as="select" value={f.severity} onChange={(e) => setFields({ ...f, severity: e.target.value })}>{["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}</Field>
          <Field label="Estimated people affected" inputMode="numeric" value={f.estimatedAffected} onChange={(e) => setFields({ ...f, estimatedAffected: e.target.value })} />
          <div className="sm:col-span-2"><Button size="sm" variant="secondary" disabled={busy || !fields} onClick={async () => { const out = await done(() => admin.patch(base, { containment: f.containment, evidenceNotes: f.evidenceNotes, severity: f.severity, estimatedAffected: Number(f.estimatedAffected) || 0 }), "Saved."); if (out !== undefined) setFields(null); }}>Save investigation record</Button></div>
          <div>
            <Field label="Add a remediation step" value={remed} onChange={(e) => setRemed(e.target.value)} />
            <Button size="sm" variant="secondary" className="mt-2" disabled={busy || remed.trim().length < 3} onClick={async () => { if ((await done(() => admin.post(`${base}/remediation`, { text: remed }), "Remediation recorded.")) !== undefined) setRemed(""); }}>Add</Button>
          </div>
          <div>
            <Field label="Supporting document name" value={doc.name} onChange={(e) => setDoc({ ...doc, name: e.target.value })} />
            <Field label="Where it is stored (private location)" value={doc.reference} onChange={(e) => setDoc({ ...doc, reference: e.target.value })} className="mt-2" />
            <Button size="sm" variant="secondary" className="mt-2" disabled={busy || doc.name.length < 2 || doc.reference.length < 2} onClick={async () => { if ((await done(() => admin.post(`${base}/documents`, doc), "Document recorded.")) !== undefined) setDoc({ name: "", reference: "" }); }}>Add document</Button>
          </div>
        </section>
      )}

      {(i.remediation.length > 0 || i.documents.length > 0) && (
        <section className="border-t border-line pt-5 text-sm">
          {i.remediation.map((r, n) => <p key={n}>• {r.text} <span className="text-muted">({formatDateTime(r.at)})</span></p>)}
          {i.documents.map((d, n) => <p key={n}>📎 {d.name}: <span className="text-muted">{d.reference}</span></p>)}
        </section>
      )}

      <section aria-labelledby="inc-tl" className="border-t border-line pt-5">
        <h3 id="inc-tl" className="mb-2 text-sm font-semibold">Timeline</h3>
        <ol className="space-y-1 text-sm text-muted">{i.timeline.map((t, n) => <li key={n}>{formatDateTime(t.at)}: {t.event}</li>)}</ol>
      </section>

      <ConfirmDialog open={confirmSend} danger title="Send this notice?" confirmLabel="Send now" busy={busy} message={`The approved notice is delivered to ${i.affectedCount} account(s) and cannot be recalled.`} onCancel={() => setConfirmSend(false)} onConfirm={async () => { await done(() => admin.post(`${base}/notice/send`), "Notice sent."); setConfirmSend(false); }} />
      <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </div>
  );
}

export default function Incidents() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(null);
  const { data, meta, loading, error, reload } = useAdminList("/privacy/incidents", { status, page });
  const { run, busy, error: actionError } = useRun();

  async function create() {
    const body = { title: adding.title, description: adding.description, discoveredAt: new Date(adding.discoveredAt).toISOString(), occurredAt: adding.occurredAt ? new Date(adding.occurredAt).toISOString() : undefined, systems: list(adding.systems), dataTypes: list(adding.dataTypes), estimatedAffected: Number(adding.estimatedAffected) || 0, severity: adding.severity };
    const out = await run(() => admin.post("/privacy/incidents", body), "Incident recorded.");
    if (out) (setAdding(null), reload(), setOpen(out.incidentId));
  }

  return (
    <>
      <PageHeader title="Breach incidents" description="Record, investigate and respond to personal data breaches. Notices and Board reports follow the Rules but are never sent on their own." actions={<Button onClick={() => setAdding({ title: "", description: "", discoveredAt: localNow(), occurredAt: "", systems: "", dataTypes: "", estimatedAffected: "0", severity: "medium" })}>Report an incident</Button>} />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <FilterBar>
          <Field label="Show" as="select" value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))} className="w-48">
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </Field>
        </FilterBar>
        <DataTable
          caption="Breach incidents"
          loading={loading}
          rows={data}
          empty="No incidents recorded."
          rowKey={(r) => r.incidentId}
          onRowClick={(r) => setOpen(r.incidentId)}
          columns={[
            { key: "incidentId", header: "Incident", render: (r) => <span className="font-mono font-semibold text-brand">{r.incidentId}</span> },
            { key: "title", header: "Title" },
            { key: "severity", header: "Severity", render: (r) => <Badge tone={SEVERITY_TONE[r.severity]}>{r.severity}</Badge> },
            { key: "status", header: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{statusLabel(r.status)}</Badge> },
            { key: "discoveredAt", header: "Discovered", render: (r) => formatDateTime(r.discoveredAt) },
            { key: "affectedCount", header: "Affected", align: "right", render: (r) => `${r.affectedCount}/${r.estimatedAffected}` },
            { key: "flag", header: "", render: (r) => (r.boardDetailedOverdue ? <Badge tone="danger">Board report overdue</Badge> : null) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>

      <Modal open={Boolean(open)} title={open ?? ""} onClose={() => setOpen(null)} wide>
        {open && <IncidentDetail id={open} onClose={() => setOpen(null)} onChanged={reload} />}
      </Modal>

      <Modal open={Boolean(adding)} title="Report an incident" onClose={() => setAdding(null)} wide footer={<><Button variant="ghost" onClick={() => setAdding(null)}>Cancel</Button><Button onClick={create} loading={busy} disabled={!adding?.title || adding.title.length < 3}>Record incident</Button></>}>
        {adding && (
          <div className="grid gap-4 sm:grid-cols-2">
            <ActionError error={actionError} />
            <Field label="Title" value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} className="sm:col-span-2" />
            <Field label="What happened" as="textarea" value={adding.description} onChange={(e) => setAdding({ ...adding, description: e.target.value })} className="sm:col-span-2" />
            <Field label="Discovered (becoming aware)" type="datetime-local" value={adding.discoveredAt} onChange={(e) => setAdding({ ...adding, discoveredAt: e.target.value })} />
            <Field label="Occurred (if known)" optional type="datetime-local" value={adding.occurredAt} onChange={(e) => setAdding({ ...adding, occurredAt: e.target.value })} />
            <Field label="Affected systems (comma separated)" value={adding.systems} onChange={(e) => setAdding({ ...adding, systems: e.target.value })} />
            <Field label="Kinds of data exposed (comma separated)" value={adding.dataTypes} onChange={(e) => setAdding({ ...adding, dataTypes: e.target.value })} />
            <Field label="Estimated people affected" inputMode="numeric" value={adding.estimatedAffected} onChange={(e) => setAdding({ ...adding, estimatedAffected: e.target.value })} />
            <Field label="Severity" as="select" value={adding.severity} onChange={(e) => setAdding({ ...adding, severity: e.target.value })}>{["low", "medium", "high", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}</Field>
          </div>
        )}
      </Modal>
    </>
  );
}
