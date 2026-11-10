"use client";

import { useState } from "react";
import { DataTable, ErrorBanner, FilterBar, Modal, PageHeader, Pagination, Panel, StatCard, Tabs, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { useToast } from "@/providers/ToastProvider";

const STATUS_TONE = { queued: "info", sending: "info", sent: "success", delivered: "success", failed: "danger", skipped: "warning" };
const TPL_TONE = { draft: "neutral", pending_approval: "warning", approved: "success", rejected: "danger" };
const sel = "h-10 rounded-md border border-line bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-focus/25";

const MODE = {
  simulated: { tone: "warning", title: "Simulated mode", text: "Messages are recorded here as if sent, but nothing leaves the server. Use this to check the flow before WhatsApp is connected." },
  not_configured: { tone: "danger", title: "WhatsApp is selected but not connected", text: "The real WhatsApp adapter has not been implemented or configured yet, so no message is sent. Messages will be recorded as skipped." },
  live: { tone: "success", title: "Live", text: "Approved and enabled templates are sent to customers through WhatsApp." },
};

function History() {
  const toast = useToast();
  const [filters, setFilters] = useState({ status: "", templateKey: "", q: "" });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAdminList("/notifications", { ...filters, page });
  const templates = useAdminList("/notifications/templates");
  const [busy, setBusy] = useState(null);

  async function act(id, fn, ok) {
    setBusy(id);
    try {
      await fn();
      toast.success(ok);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <form onSubmit={(e) => { e.preventDefault(); setFilters({ ...filters, q }); setPage(1); }}>
          <FilterBar>
            <label className="text-xs font-medium text-muted">Status
              <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className={`${sel} mt-1 block`}>
                <option value="">All</option>
                {["queued", "sent", "delivered", "failed", "skipped"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-muted">Message
              <select value={filters.templateKey} onChange={(e) => { setFilters({ ...filters, templateKey: e.target.value }); setPage(1); }} className={`${sel} mt-1 block`}>
                <option value="">All</option>
                {(templates.data ?? []).filter((t) => !t.viaOtpProvider).map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </label>
            <label className="min-w-40 flex-1 text-xs font-medium text-muted">Mobile
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by number" className={`${sel} mt-1 w-full`} />
            </label>
            <Button type="submit">Search</Button>
            <Button variant="secondary" onClick={() => act("process", () => admin.post("/notifications/process"), "Queue processed.")} loading={busy === "process"}>Send queued now</Button>
          </FilterBar>
        </form>
        <DataTable
          caption="Message history"
          rows={data}
          loading={loading}
          empty="No messages yet. They appear here when orders are placed, paid, shipped and so on."
          columns={[
            { key: "createdAt", header: "When", render: (n) => formatDateTime(n.createdAt) },
            { key: "templateKey", header: "Message", render: (n) => <><span className="font-medium">{n.templateKey.replaceAll("_", " ")}</span><br /><span className="text-xs text-muted">{n.mobile}</span></> },
            { key: "preview", header: "Text", className: "max-w-xs", render: (n) => <span className="line-clamp-2 text-xs text-muted">{n.preview}</span> },
            { key: "status", header: "Status", render: (n) => (
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={STATUS_TONE[n.status]}>{n.status}</Badge>
                {n.simulated && n.status === "sent" && <Badge tone="neutral">simulated</Badge>}
                {n.attempts > 1 && <span className="text-xs text-muted">{n.attempts} tries</span>}
              </div>
            ) },
            { key: "lastError", header: "Note", className: "max-w-xs", render: (n) => <span className="text-xs text-muted">{n.status === "queued" && n.nextAttemptAt ? `Next try ${formatDateTime(n.nextAttemptAt)}. ` : ""}{n.lastError}</span> },
            { key: "actions", header: "", align: "right", render: (n) => ["failed", "skipped"].includes(n.status) && <Button size="sm" variant="secondary" loading={busy === n.id} onClick={() => act(n.id, () => admin.post(`/notifications/${n.id}/retry`), "Queued to retry.")}>Retry</Button> },
          ]}
        />
        <Pagination meta={meta} onPage={setPage} />
      </Panel>
    </>
  );
}

function Templates() {
  const toast = useToast();
  const { data, error, loading, reload } = useAdminList("/notifications/templates");
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function save(key, body, close = true) {
    setBusy(true);
    setErrors({});
    try {
      await admin.patch(`/notifications/templates/${key}`, body);
      toast.success("Template saved.");
      if (close) setEdit(null);
      reload();
    } catch (e) {
      setErrors(e.fields ?? { form: e.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ErrorBanner error={error} onRetry={reload} />
      <p className="mb-4 max-w-3xl text-sm text-muted">Each message type needs a template approved by WhatsApp. Once approved, enter its exact name and mark it <strong>approved</strong> here. Until then, nothing is sent to customers through WhatsApp. You can also switch any message off.</p>
      <Panel padded={false}>
        <DataTable
          caption="Templates"
          rows={data}
          loading={loading}
          rowKey={(t) => t.key}
          columns={[
            { key: "label", header: "Message", render: (t) => <><span className="font-semibold">{t.label}</span><br /><span className="font-mono text-xs text-muted">{t.key}{t.viaOtpProvider ? " · sent via the login-code provider" : ""}</span></> },
            { key: "providerTemplateName", header: "Provider template", render: (t) => t.providerTemplateName || <span className="text-muted">Not set</span> },
            { key: "status", header: "Approval", render: (t) => <Badge tone={TPL_TONE[t.status]}>{t.status.replace("_", " ")}</Badge> },
            { key: "enabled", header: "Enabled", render: (t) => (
              <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-brand" checked={t.enabled} disabled={t.viaOtpProvider} onChange={(e) => save(t.key, { enabled: e.target.checked }, false)} aria-label={`${t.label} enabled`} />
                {t.enabled ? "On" : "Off"}
              </label>
            ) },
            { key: "actions", header: "", align: "right", render: (t) => <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setEdit({ ...t }); }}>Edit</Button> },
          ]}
        />
      </Panel>
      <Modal open={Boolean(edit)} wide onClose={() => setEdit(null)} title={edit?.label ?? ""}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={() => save(edit.key, { providerTemplateName: edit.providerTemplateName, language: edit.language, body: edit.body, status: edit.status })}>Save</Button></>}>
        {edit && (
          <div className="space-y-4">
            <Field label="Approved template name" optional value={edit.providerTemplateName} onChange={(e) => setEdit({ ...edit, providerTemplateName: e.target.value })} error={errors.providerTemplateName} hint="Exactly as registered with WhatsApp: lowercase letters, digits and underscores." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Language code" value={edit.language} onChange={(e) => setEdit({ ...edit, language: e.target.value })} error={errors.language} hint="For example en or en_US." />
              <Field as="select" label="Approval status" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="draft">Draft</option><option value="pending_approval">Waiting for approval</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
              </Field>
            </div>
            <Field as="textarea" label="Message preview text" value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} error={errors.body} hint={`Variables you can use: ${edit.variables.map((v) => `{{${v}}}`).join(", ")}. The wording sent to customers is the approved template at WhatsApp.`} />
            {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Notifications() {
  const [tab, setTab] = useState("history");
  const summary = useAdminList("/notifications/summary");
  const s = summary.data;
  const mode = s ? MODE[s.mode] : null;
  return (
    <>
      <PageHeader title="Notifications" description="WhatsApp messages for order updates: templates, history, failures and retries." />
      {!s ? <Skeleton className="mb-6 h-24" /> : (
        <>
          <p className={`mb-6 rounded-md border p-4 text-sm ${mode.tone === "success" ? "border-success/30 bg-success/10" : mode.tone === "danger" ? "border-danger/30 bg-danger/10" : "border-warning/40 bg-warning/10"}`} role="note">
            <strong>{mode.title}.</strong> {mode.text} Login codes are sent separately through the OTP provider and are never stored in this history.
          </p>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Waiting to send" value={s.counts.queued + s.counts.sending} />
            <StatCard label="Sent" value={s.counts.sent + s.counts.delivered} hint={s.mode === "simulated" ? "Simulated: nothing was really sent" : undefined} />
            <StatCard label="Failed" value={s.counts.failed} tone={s.counts.failed ? "danger" : "default"} hint="After 5 attempts. Retry from History." />
            <StatCard label="Skipped" value={s.counts.skipped} tone={s.counts.skipped ? "warning" : "default"} hint="Switched off, or not sendable yet" />
          </div>
        </>
      )}
      <Tabs tabs={[{ value: "history", label: "History" }, { value: "templates", label: "Templates" }]} value={tab} onChange={setTab} label="Notifications" />
      {tab === "history" ? <History /> : <Templates />}
    </>
  );
}
