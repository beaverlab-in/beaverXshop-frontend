"use client";

import { useState } from "react";
import { ActionError, useRun } from "@/components/admin/privacy/common";
import { ErrorBanner, PageHeader, Panel } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";

function Form({ initial, reload }) {
  const [f, setF] = useState({
    contactName: initial.contactName ?? "",
    contactTitle: initial.contactTitle ?? "",
    contactEmail: initial.contactEmail ?? "",
    contactPhone: initial.contactPhone ?? "",
    grievanceResponseDays: String(initial.grievanceResponseDays ?? 90),
    requestResponseDays: initial.requestResponseDays ? String(initial.requestResponseDays) : "",
    boardComplaintUrl: initial.boardComplaintUrl ?? "",
    optionalTracking: Boolean(initial.optionalTracking),
    incidentSelfApproval: Boolean(initial.incidentSelfApproval),
    childrenMode: initial.childrenMode ?? "adult_only",
  });
  const { run, busy, error } = useRun();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const check = (k) => (e) => setF({ ...f, [k]: e.target.checked });

  async function save(e) {
    e.preventDefault();
    const body = {
      contactName: f.contactName.trim(),
      contactTitle: f.contactTitle.trim(),
      contactEmail: f.contactEmail.trim(),
      contactPhone: f.contactPhone.trim(),
      grievanceResponseDays: Number(f.grievanceResponseDays),
      requestResponseDays: f.requestResponseDays ? Number(f.requestResponseDays) : null,
      boardComplaintUrl: f.boardComplaintUrl.trim(),
      optionalTracking: f.optionalTracking,
      incidentSelfApproval: f.incidentSelfApproval,
      childrenMode: f.childrenMode,
    };
    if (await run(() => admin.patch("/privacy/settings", body), "Privacy settings saved.")) reload();
  }

  return (
    <form onSubmit={save} noValidate className="space-y-6">
      <ActionError error={error} />
      <Panel title="Privacy contact (published on the website and in every response)">
        <p className="mb-4 text-sm text-muted">The Rules require the business contact information of the person who can answer questions about how personal data is processed (or of the Data Protection Officer, if you must appoint one) to be shown prominently. Do not enter details you have not confirmed.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={f.contactName} onChange={set("contactName")} />
          <Field label="Role or title" optional value={f.contactTitle} onChange={set("contactTitle")} />
          <Field label="Email" type="email" value={f.contactEmail} onChange={set("contactEmail")} />
          <Field label="Phone" optional value={f.contactPhone} onChange={set("contactPhone")} />
        </div>
      </Panel>

      <Panel title="Response times">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Grievance response period (days)" inputMode="numeric" value={f.grievanceResponseDays} onChange={set("grievanceResponseDays")} hint="The Rules allow a reasonable period of at most 90 days. Choose a shorter one if you can meet it." />
          <Field label="Target for other requests (days)" optional inputMode="numeric" value={f.requestResponseDays} onChange={set("requestResponseDays")} hint="The Rules give no fixed period for these. A target you set is shown as the 'respond by' date. Leave blank for none." />
        </div>
        <Field label="How to complain to the Data Protection Board (link)" optional className="mt-4" value={f.boardComplaintUrl} onChange={set("boardComplaintUrl")} hint="An https:// link to the Board's official instructions. Leave blank until you have confirmed it." />
      </Panel>

      <Panel title="Cookies and tracking">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={f.optionalTracking} onChange={check("optionalTracking")} className="mt-1 size-5 shrink-0 accent-brand" />
          <span><strong>An analytics or marketing tool is installed on the website.</strong><br /><span className="text-muted">Turn this on only when one really is. Visitors then see the cookie choices banner, and the tool must load only after they opt in (wrap it in the consent gate). Leave it off while the site uses only essential cookies.</span></span>
        </label>
      </Panel>

      <Panel title="Children">
        <Field label="How under-18 accounts are handled" as="select" value={f.childrenMode} onChange={set("childrenMode")}>
          <option value="adult_only">Adult-only accounts: under-18 accounts are restricted, a parent should order</option>
          <option value="parental_consent">Parental verification: staff verify a parent, then orders unlock</option>
        </Field>
        <p className="mt-2 text-sm text-muted">Parental verification must follow a written procedure that checks the parent is an identifiable adult. Get it reviewed by a lawyer before switching it on.</p>
      </Panel>

      <Panel title="Breach notices">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={f.incidentSelfApproval} onChange={check("incidentSelfApproval")} className="mt-1 size-5 shrink-0 accent-brand" />
          <span><strong>Allow the person who prepared a breach notice to approve it too.</strong><br /><span className="text-muted">Off by default: a second authorised person must approve. Turn on only if you are a one-person team.</span></span>
        </label>
      </Panel>
      <Button type="submit" loading={busy}>Save privacy settings</Button>
    </form>
  );
}

export default function PrivacySettings() {
  const { data, error, reload } = useAsync(() => admin.get("/privacy/settings"), []);
  return (
    <>
      <PageHeader title="Privacy settings" description="Contact details, response times and switches that the privacy features depend on." />
      <ErrorBanner error={error} onRetry={reload} />
      {!data ? <Skeleton className="h-96" /> : <Form key={JSON.stringify(data)} initial={data} reload={reload} />}
    </>
  );
}
