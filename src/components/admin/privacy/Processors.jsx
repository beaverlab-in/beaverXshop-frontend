"use client";

import { useState } from "react";
import { ActionError, statusLabel, useRun } from "@/components/admin/privacy/common";
import { DataTable, ErrorBanner, Modal, PageHeader, Panel, StatCard, formatDate } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";

const tone = (v) => (["signed", "reviewed", "active", "no", "not_required"].includes(v) ? "success" : ["unknown", "not_started", "not_reviewed"].includes(v) ? "warning" : "neutral");
const OPTIONS = {
  integrationStatus: ["planned", "active", "inactive"],
  contractStatus: ["not_started", "requested", "signed", "not_required"],
  securityReview: ["not_reviewed", "in_progress", "reviewed"],
  crossBorder: ["unknown", "no", "yes"],
};
const LABELS = { integrationStatus: "Integration", contractStatus: "Agreement", securityReview: "Security review", crossBorder: "Data leaves India?" };

export default function Processors() {
  const { user } = useAuth();
  const canEdit = user.permissions.includes("privacy.settings.manage");
  const { data, error, reload } = useAsync(() => admin.get("/privacy/processors"), []);
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({});
  const { run, busy, error: actionError } = useRun();

  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const { items, status } = data;

  function open(p) {
    setEdit(p);
    setForm({ service: p.service, categories: p.categories.join("\n"), location: p.location, crossBorder: p.crossBorder, integrationStatus: p.integrationStatus, contractStatus: p.contractStatus, securityReview: p.securityReview, retention: p.retention, contactName: p.contactName, contactEmail: p.contactEmail, notes: p.notes });
  }
  async function save() {
    const body = { ...form, categories: form.categories.split("\n").map((s) => s.trim()).filter(Boolean) };
    if (await run(() => admin.patch(`/privacy/processors/${edit.key}`, body), "Processor saved.")) (setEdit(null), reload());
  }
  async function add() {
    if (await run(() => admin.post("/privacy/processors", { key: form.key, name: form.name, service: form.service }), "Processor added.")) (setAdding(false), reload());
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <>
      <PageHeader
        title="Third-party processors"
        description="Everyone who handles personal data on BeaverLab's behalf. Nothing is assumed compliant: locations, agreements and reviews start unrecorded."
        actions={canEdit && <Button onClick={() => (setAdding(true), setForm({ key: "", name: "", service: "" }))}>Add processor</Button>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active" value={status.active} hint={`${status.total} not inactive`} />
        <StatCard label="Agreement not signed" value={status.contractPending} tone={status.contractPending ? "warning" : "default"} />
        <StatCard label="No security review" value={status.reviewPending} tone={status.reviewPending ? "warning" : "default"} />
        <StatCard label="Location unknown" value={status.crossBorderUnknown} tone={status.crossBorderUnknown ? "warning" : "default"} />
      </div>
      <Panel padded={false}>
        <DataTable
          caption="Data processors"
          loading={false}
          rows={items}
          rowKey={(r) => r.key}
          onRowClick={open}
          columns={[
            { key: "name", header: "Provider", render: (r) => <span className="font-medium">{r.name}</span> },
            { key: "service", header: "Service", className: "max-w-xs text-muted" },
            { key: "categories", header: "Data shared", render: (r) => <span className="line-clamp-2 max-w-xs">{r.categories.join(", ")}</span> },
            { key: "integrationStatus", header: "Status", render: (r) => <Badge tone={tone(r.integrationStatus)}>{statusLabel(r.integrationStatus)}</Badge> },
            { key: "contractStatus", header: "Agreement", render: (r) => <Badge tone={tone(r.contractStatus)}>{statusLabel(r.contractStatus)}</Badge> },
            { key: "securityReview", header: "Security", render: (r) => <Badge tone={tone(r.securityReview)}>{statusLabel(r.securityReview)}</Badge> },
            { key: "location", header: "Location", render: (r) => r.location || "Not recorded" },
            { key: "lastReviewedAt", header: "Reviewed", render: (r) => formatDate(r.lastReviewedAt) },
          ]}
        />
      </Panel>

      <Modal open={Boolean(edit)} title={edit?.name ?? ""} onClose={() => setEdit(null)} wide footer={canEdit ? <><Button variant="ghost" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save} loading={busy}>Save</Button></> : <Button variant="secondary" onClick={() => setEdit(null)}>Close</Button>}>
        {edit && (
          <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
            <ActionError error={actionError} />
            <Field label="Service provided" value={form.service} onChange={set("service")} className="sm:col-span-2" />
            <Field label="Data categories shared (one per line)" as="textarea" value={form.categories} onChange={set("categories")} className="sm:col-span-2" hint="Only what the service needs." />
            {Object.entries(OPTIONS).map(([k, opts]) => (
              <Field key={k} label={LABELS[k]} as="select" value={form[k]} onChange={set(k)}>
                {opts.map((o) => <option key={o} value={o}>{statusLabel(o)}</option>)}
              </Field>
            ))}
            <Field label="Data location" value={form.location} onChange={set("location")} hint="Country or region where known. Leave blank if not confirmed." />
            <Field label="Retention at the provider" value={form.retention} onChange={set("retention")} />
            <Field label="Contact name" optional value={form.contactName} onChange={set("contactName")} />
            <Field label="Contact email" optional type="email" value={form.contactEmail} onChange={set("contactEmail")} />
            <Field label="Notes" as="textarea" value={form.notes} onChange={set("notes")} className="sm:col-span-2" />
          </fieldset>
        )}
      </Modal>

      <Modal open={adding} title="Add a processor" onClose={() => setAdding(false)} footer={<><Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button><Button onClick={add} loading={busy} disabled={!form.key || !form.name}>Add</Button></>}>
        <ActionError error={actionError} />
        <div className="space-y-4">
          <Field label="Name" value={form.name ?? ""} onChange={set("name")} />
          <Field label="Short key" value={form.key ?? ""} onChange={set("key")} hint="Letters, numbers and underscores, for example sms_gateway." />
          <Field label="Service" optional value={form.service ?? ""} onChange={set("service")} />
        </div>
      </Modal>
    </>
  );
}
