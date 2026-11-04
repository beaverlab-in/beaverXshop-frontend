"use client";

import Link from "next/link";
import { useState } from "react";
import { ActionError, StepUpNotice, useRun } from "@/components/admin/privacy/common";
import { ErrorBanner, Modal, PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import PolicyBody from "@/components/site/PolicyBody";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";

function Editor({ view, reload }) {
  const initial = view.draft ?? view.published;
  const [sections, setSections] = useState(initial.sections.map((s) => ({ key: s.key, title: s.title, body: s.body })));
  const [changeNote, setChangeNote] = useState(view.draft?.changeNote ?? "");
  const [preview, setPreview] = useState(null);
  const { run, busy, reauth, error } = useRun();
  const dirty = JSON.stringify(sections) !== JSON.stringify(initial.sections.map((s) => ({ key: s.key, title: s.title, body: s.body })));
  const setBody = (i, body) => setSections((list) => list.map((s, j) => (j === i ? { ...s, body } : s)));

  async function save() {
    const out = await run(() => admin.put("/privacy/policy/draft", { sections, changeNote }), "Draft saved.");
    if (out) reload();
  }
  async function openPreview() {
    if (dirty && !(await run(() => admin.put("/privacy/policy/draft", { sections, changeNote })))) return;
    const out = await run(() => admin.get("/privacy/policy/preview"));
    if (out) setPreview(out);
  }
  async function publish() {
    if (dirty && !(await run(() => admin.put("/privacy/policy/draft", { sections, changeNote })))) return;
    const out = await run(() => admin.post("/privacy/policy/publish"), "Privacy policy published.");
    if (out) reload();
  }

  return (
    <>
      {reauth && <StepUpNotice />}
      <ActionError error={error} />
      {view.missing.length > 0 && (
        <div role="alert" className="mb-5 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-semibold">Before you can publish, fill in:</p>
          <ul className="mt-1 list-disc pl-5">{view.missing.map((m) => <li key={m.path}>{m.label}</li>)}</ul>
          <p className="mt-2">The policy must never show invented details, so publishing stays locked until these exist. <Link href="/admin/settings" className="font-medium text-brand underline underline-offset-4">Company settings</Link> · <Link href="/admin/privacy/settings" className="font-medium text-brand underline underline-offset-4">Privacy settings</Link></p>
        </div>
      )}
      <p className="mb-5 rounded-md bg-subtle p-4 text-sm text-slate-700">
        Write in plain language. Placeholders such as <code className="rounded bg-surface px-1">{"{{company.legalName}}"}</code>, <code className="rounded bg-surface px-1">{"{{privacy.contactEmail}}"}</code> and the tables <code className="rounded bg-surface px-1">{"{{processors_table}}"}</code>, <code className="rounded bg-surface px-1">{"{{retention_table}}"}</code> are filled from your real settings and registries when the page is shown. The text is a starting draft: have a lawyer review it before you publish.
      </p>
      <div className="space-y-4">
        {sections.map((s, i) => (
          <details key={s.key} className="rounded-card border border-line bg-surface" open={i === 0}>
            <summary className="cursor-pointer px-5 py-4 font-semibold">{s.title}</summary>
            <div className="border-t border-line p-5">
              <Field label={`Text for “${s.title}”`} as="textarea" value={s.body} onChange={(e) => setBody(i, e.target.value)} className="[&_textarea]:!min-h-40" hint="Supports **bold**, - lists, [links](/path) and pipe tables." />
            </div>
          </details>
        ))}
      </div>
      <Field label="What changed in this version" optional className="mt-5 max-w-xl" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={save} loading={busy} disabled={!dirty && Boolean(view.draft)}>Save draft</Button>
        <Button variant="secondary" onClick={openPreview} disabled={busy}>Preview</Button>
        <Button onClick={publish} loading={busy} disabled={view.missing.length > 0 || (!view.draft && !dirty)}>Publish this version</Button>
      </div>
      <Modal open={Boolean(preview)} title={`Preview of version ${preview?.version ?? ""}`} onClose={() => setPreview(null)} wide footer={<Button variant="secondary" onClick={() => setPreview(null)}>Close</Button>}>
        <div className="space-y-6">
          {preview?.sections.map((s) => (
            <section key={s.key}>
              <h3 className="mb-2 text-lg font-semibold">{s.title}</h3>
              <PolicyBody text={s.body} />
            </section>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default function PolicyManagement() {
  const { data, error, reload } = useAsync(() => admin.get("/privacy/policy"), []);
  const { run, busy, error: noticeError } = useRun();
  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  return (
    <>
      <PageHeader
        title="Privacy policy"
        description="Edit, preview and publish the privacy policy at /privacy-policy. Every version is kept."
        actions={<Link href="/privacy-policy" className="inline-flex min-h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-semibold hover:bg-subtle">View public page</Link>}
      />
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Published version">
          {data.published ? <p className="text-sm">Version <strong>{data.published.version}</strong>, published {formatDateTime(data.published.publishedAt)}.</p> : <p className="text-sm text-muted">Nothing is published. /privacy-policy says so until you publish.</p>}
          <p className="mt-2 text-xs text-muted">{data.draft ? `A draft (version ${data.draft.version}) is waiting.` : "No unpublished changes."}</p>
        </Panel>
        <Panel title="Collection notice">
          <p className="text-sm text-muted">The short notice shown where data is collected is generated from the data inventory and your contact settings. If you changed the inventory or processors, publish a fresh version so consents point at the right text.</p>
          <ActionError error={noticeError} />
          <Button size="sm" variant="secondary" className="mt-3" loading={busy} onClick={async () => { const out = await run(() => admin.post("/privacy/notice/republish"), "Collection notice is up to date."); if (out) reload(); }}>Check and republish</Button>
        </Panel>
      </div>
      <Editor key={`${data.draft?._id ?? data.published?._id}`} view={data} reload={reload} />
      <Panel title="Versions" className="mt-8" padded={false}>
        <ul className="divide-y divide-line text-sm">
          {data.versions.map((v) => (
            <li key={v.version} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
              <span>Version {v.version} · {v.changeNote || "No note"}</span>
              <span className="flex items-center gap-2"><Badge tone={v.status === "published" ? "success" : v.status === "draft" ? "warning" : "neutral"}>{v.status}</Badge><span className="text-muted">{formatDateTime(v.publishedAt ?? v.createdAt)}</span></span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
