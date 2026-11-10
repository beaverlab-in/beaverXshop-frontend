"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ActionError, Info, NEXT_STATUSES, StatusPill, StepUpNotice, TYPES, statusLabel, typeLabel, useRun } from "@/components/admin/privacy/common";
import { ConfirmDialog, DataTable, ErrorBanner, FilterBar, Modal, PageHeader, Pagination, Panel, formatDate, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";

function RequestDetail({ requestId, onClose, onChanged }) {
  const { data: r, error, reload } = useAsync(() => admin.get(`/privacy/requests/${requestId}`), [requestId]);
  const staff = useAsync(() => admin.get("/privacy/assignees"), []);
  const { run, busy, reauth, error: actionError } = useRun();
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [attach, setAttach] = useState(false);
  const [res, setRes] = useState({ outcome: "fulfilled", text: "" });
  const [confirmErase, setConfirmErase] = useState(false);
  const base = `/privacy/requests/${requestId}`;
  const done = async (fn, msg) => {
    const out = await run(fn, msg);
    if (out !== undefined) (reload(), onChanged());
    return out;
  };

  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!r) return <Skeleton className="h-64" />;
  const open = r.status !== "completed" && !r.autoCompleted;
  return (
    <div className="space-y-6">
      {reauth && <StepUpNotice />}
      <ActionError error={actionError} />
      <dl className="grid gap-4 sm:grid-cols-3">
        <Info label="Request">{r.requestId}</Info>
        <Info label="Type">{typeLabel(r.type)}</Info>
        <Info label="Status"><StatusPill status={r.status} /></Info>
        <Info label="Customer">{r.customer ? `${r.customer.name || "No name"} · ${r.customer.mobile}` : ""}</Info>
        <Info label="Submitted">{formatDateTime(r.submittedAt)}</Info>
        <Info label="Respond by">{r.dueAt ? <span className={r.overdue ? "font-semibold text-danger" : ""}>{formatDate(r.dueAt)}{r.overdue ? " (past due)" : ""}</span> : "No target set"}</Info>
        <Info label="Identity check">{r.identityVerifiedAt ? `Fresh login code at ${formatDateTime(r.identityVerifiedAt)}` : r.type === "GRIEVANCE" ? "Not required for grievances" : ""}</Info>
        <Info label="Assigned to">{r.assignedToName}</Info>
      </dl>
      <div>
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">What the person wrote</p>
        <p className="mt-1 text-sm font-medium">{r.subject}</p>
        <p className="mt-0.5 whitespace-pre-line text-sm">{r.details || "Nothing added."}</p>
        {r.payload && <pre className="mt-2 overflow-x-auto rounded-md bg-subtle p-3 text-xs">{JSON.stringify(r.payload, null, 2)}</pre>}
      </div>

      {open && (
        <>
          <section aria-labelledby="st-h">
            <h3 id="st-h" className="mb-2 text-sm font-semibold">Move to</h3>
            <div className="flex flex-wrap gap-2">
              {(NEXT_STATUSES[r.status] ?? []).map((to) => (
                <Button key={to} size="sm" variant={to === "rejected" ? "danger" : "secondary"} disabled={busy} onClick={() => done(() => admin.post(`${base}/status`, { to }), `Moved to ${statusLabel(to).toLowerCase()}.`)}>
                  {statusLabel(to)}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Completing needs a recorded resolution (below). The person is told of each change by message and in their account.</p>
          </section>

          {r.status === "approved" && r.type === "CORRECTION" && <Button size="sm" disabled={busy} onClick={() => done(() => admin.post(`${base}/apply-correction`), "Correction applied.")}>Apply the correction to the account</Button>}
          {r.status === "approved" && r.type === "ERASURE" && <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirmErase(true)}>Execute erasure</Button>}

          <section aria-labelledby="resp-h" className="grid gap-4 border-t border-line pt-5">
            <h3 id="resp-h" className="text-sm font-semibold">Respond to the person (they see this)</h3>
            <Field label="Response" as="textarea" value={reply} onChange={(e) => setReply(e.target.value)} />
            {r.type === "ACCESS" && (
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} className="size-4 accent-brand" /> Attach a generated summary of their data</label>
            )}
            <div><Button size="sm" disabled={busy || (!reply.trim() && !attach)} onClick={async () => { if ((await done(() => admin.post(`${base}/respond`, { text: reply, attachAccessSummary: attach }), "Response sent.")) !== undefined) (setReply(""), setAttach(false)); }}>Send response</Button></div>
          </section>

          <section aria-labelledby="res-h" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-[12rem_1fr]">
            <h3 id="res-h" className="text-sm font-semibold sm:col-span-2">Resolution</h3>
            <Field label="Outcome" as="select" value={res.outcome} onChange={(e) => setRes({ ...res, outcome: e.target.value })}>
              <option value="fulfilled">Fulfilled</option>
              <option value="partially_fulfilled">Partly fulfilled</option>
              <option value="rejected">Refused</option>
            </Field>
            <Field label="What was done, or why it was refused" as="textarea" value={res.text} onChange={(e) => setRes({ ...res, text: e.target.value })} />
            <div className="sm:col-span-2"><Button size="sm" variant="secondary" disabled={busy || res.text.trim().length < 5} onClick={() => done(() => admin.post(`${base}/resolution`, res), "Resolution saved.")}>Save resolution</Button></div>
          </section>

          <section aria-labelledby="as-h" className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <h3 id="as-h" className="text-sm font-semibold sm:col-span-2">Assignment and internal notes (staff only)</h3>
            <Field label="Assigned to" as="select" value={r.assignedTo ?? ""} onChange={(e) => done(() => admin.post(`${base}/assign`, { assigneeId: e.target.value || null }), "Assignment saved.")}>
              <option value="">Unassigned</option>
              {(staff.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Field>
            <div className="sm:col-span-2">
              <Field label="Add an internal note" as="textarea" value={note} onChange={(e) => setNote(e.target.value)} />
              <Button size="sm" variant="secondary" className="mt-2" disabled={busy || !note.trim()} onClick={async () => { if ((await done(() => admin.post(`${base}/note`, { text: note }), "Note added.")) !== undefined) setNote(""); }}>Add note</Button>
            </div>
          </section>
        </>
      )}

      {r.internalNotes.length > 0 && (
        <section aria-labelledby="notes-h" className="border-t border-line pt-5">
          <h3 id="notes-h" className="mb-2 text-sm font-semibold">Internal notes</h3>
          <ul className="space-y-2 text-sm">{r.internalNotes.map((n, i) => <li key={i} className="rounded-md bg-subtle p-3"><span className="text-muted">{formatDateTime(n.at)}</span><br />{n.text}</li>)}</ul>
        </section>
      )}
      {r.responses.length > 0 && (
        <section aria-labelledby="sent-h" className="border-t border-line pt-5">
          <h3 id="sent-h" className="mb-2 text-sm font-semibold">Responses sent</h3>
          <ul className="space-y-2 text-sm">{r.responses.map((n, i) => <li key={i} className="rounded-md bg-subtle p-3"><span className="text-muted">{formatDateTime(n.at)}</span><br /><span className="whitespace-pre-line">{n.text}</span></li>)}</ul>
        </section>
      )}
      {r.resolution && <p className="rounded-md border border-line p-3 text-sm"><strong>Resolution ({r.resolution.outcome.replaceAll("_", " ")}):</strong> {r.resolution.text}</p>}
      <section aria-labelledby="hist-h" className="border-t border-line pt-5">
        <h3 id="hist-h" className="mb-2 text-sm font-semibold">History</h3>
        <ol className="space-y-1 text-sm text-muted">{r.history.map((h, i) => <li key={i}>{formatDateTime(h.at)}: {h.from ? `${statusLabel(h.from)} to ` : ""}{statusLabel(h.to)}{h.note ? ` (${h.note})` : ""}</li>)}</ol>
      </section>

      <ConfirmDialog
        open={confirmErase}
        danger
        title="Erase this person's data?"
        confirmLabel="Execute erasure"
        busy={busy}
        message="This signs them out and erases or anonymises their account data. Orders, invoices and payment records are kept because the law requires it. It cannot be undone."
        onCancel={() => setConfirmErase(false)}
        onConfirm={async () => { await done(() => admin.post(`${base}/execute-erasure`), "Erasure executed."); setConfirmErase(false); }}
      />
      <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
    </div>
  );
}

/** `fixedType` locks the list to one request type (the Grievances page). */
export default function PrivacyRequests({ fixedType }) {
  const sp = useSearchParams();
  const [filters, setFilters] = useState({ type: fixedType ?? "", status: sp.get("status") ?? "", overdue: sp.get("overdue") ?? "", q: "" });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const { data, meta, loading, error, reload } = useAdminList("/privacy/requests", { ...filters, page });
  const set = (k) => (e) => (setFilters({ ...filters, [k]: e.target.value }), setPage(1));
  const title = fixedType === "GRIEVANCE" ? "Grievances" : "Privacy requests";
  return (
    <>
      <PageHeader title={title} description={fixedType === "GRIEVANCE" ? "Concerns raised about personal data. Each has a response date: never more than 90 days, and shorter if the privacy settings say so." : "Access, correction, erasure, consent withdrawal, grievance and nomination requests, each with its own number and history."} />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <FilterBar>
          <Field label="Request number" value={filters.q} onChange={set("q")} placeholder="PR-2026-" className="w-44" />
          {!fixedType && (
            <Field label="Type" as="select" value={filters.type} onChange={set("type")} className="w-52">
              <option value="">All</option>
              {TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
            </Field>
          )}
          <Field label="Status" as="select" value={filters.status} onChange={set("status")} className="w-52">
            <option value="">All</option>
            <option value="open">Open</option>
            {Object.keys(NEXT_STATUSES).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </Field>
          <Field label="Past due" as="select" value={filters.overdue} onChange={set("overdue")} className="w-36">
            <option value="">Any</option>
            <option value="1">Past due only</option>
          </Field>
        </FilterBar>
        <DataTable
          caption={title}
          loading={loading}
          rows={data}
          empty="No requests match."
          onRowClick={(r) => setOpen(r.requestId)}
          rowKey={(r) => r.requestId}
          columns={[
            { key: "requestId", header: "Request", render: (r) => <span className="font-mono font-semibold tabular-nums text-brand">{r.requestId}</span> },
            { key: "type", header: "Type", render: (r) => typeLabel(r.type) },
            { key: "customer", header: "Customer", render: (r) => r.customer?.mobile ?? "" , className: "tabular-nums" },
            { key: "status", header: "Status", render: (r) => <StatusPill status={r.status} /> },
            { key: "submittedAt", header: "Submitted", render: (r) => formatDate(r.submittedAt) },
            { key: "dueAt", header: "Respond by", render: (r) => (r.dueAt ? <span className={r.overdue ? "font-semibold text-danger" : ""}>{formatDate(r.dueAt)}</span> : "") },
            { key: "assignedToName", header: "Assigned", render: (r) => r.assignedToName ?? "" },
            { key: "flag", header: "", render: (r) => (r.overdue ? <Badge tone="danger">Past due</Badge> : null) },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
      <Modal open={Boolean(open)} title={open ?? ""} onClose={() => setOpen(null)} wide>
        {open && <RequestDetail requestId={open} onClose={() => setOpen(null)} onChanged={reload} />}
      </Modal>
    </>
  );
}
