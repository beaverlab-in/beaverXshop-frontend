"use client";

import Link from "next/link";
import { ErrorBanner, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { admin } from "@/lib/client/adminApi";

// Facts about the DPDP commencement dates, for orientation only. They come from the Rules' own commencement clause (Rule 1) and
// the Government notification; check them against the official Gazette before relying on them, and ask your lawyer what applies to you.
const TIMELINE = [
  ["13 November 2025", "Rules 1, 2 and 17 to 21 (short title, definitions, and the Data Protection Board) came into force on publication."],
  ["13 November 2026", "Rule 4 (Consent Managers) comes into force one year after publication. It does not apply to BeaverLab unless you become a Consent Manager."],
  ["13 May 2027", "Rules 3, 5 to 16, 22 and 23 apply eighteen months after publication: the notice, security safeguards, breach intimation, erasure periods, children's data and rights procedures."],
];

export default function PrivacyOverview() {
  const { data, error, reload } = useAsync(() => admin.get("/privacy/overview"), []);
  if (error) return <ErrorBanner error={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-96" />;
  const { requests, consents, children, processors, openIncidents, upcomingRetention, auditEntries, setup } = data;
  const upcoming = upcomingRetention.reduce((n, u) => n + u.count, 0);
  const todo = [
    !setup.privacyContactSet && { text: "Name a privacy contact person and email. The privacy policy and every response must show it.", href: "/admin/privacy/settings" },
    setup.missingPolicyDetails.length > 0 && { text: `Business details missing for the privacy policy: ${setup.missingPolicyDetails.map((m) => m.label).join("; ")}.`, href: "/admin/settings" },
    processors.contractPending > 0 && { text: `${processors.contractPending} processor(s) have no signed agreement on record.`, href: "/admin/privacy/processors" },
    processors.reviewPending > 0 && { text: `${processors.reviewPending} processor(s) have not had a security review.`, href: "/admin/privacy/processors" },
    requests.overdue > 0 && { text: `${requests.overdue} privacy request(s) are past their response date.`, href: "/admin/privacy/requests?overdue=1" },
  ].filter(Boolean);

  return (
    <>
      <PageHeader title="Privacy overview" description="Real figures from the database. Nothing here is a placeholder." />
      <section aria-labelledby="req-h" className="mb-6">
        <h2 id="req-h" className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Requests</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Total requests" value={requests.total} href="/admin/privacy/requests" />
          <StatCard label="Pending" value={requests.pending} href="/admin/privacy/requests?status=open" />
          <StatCard label="Completed" value={requests.completed} />
          <StatCard label="Open grievances" value={requests.grievancesOpen} href="/admin/privacy/grievances" tone={requests.grievancesOpen ? "warning" : "default"} />
          <StatCard label="Past due" value={requests.overdue} tone={requests.overdue ? "danger" : "default"} href="/admin/privacy/requests?overdue=1" />
        </div>
      </section>

      <section aria-labelledby="ops-h" className="mb-6">
        <h2 id="ops-h" className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Consent, incidents and retention</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active consent records" value={consents.active} href="/admin/privacy/consents" />
          <StatCard label="Consent withdrawals" value={consents.withdrawn} />
          <StatCard label="Open breach incidents" value={openIncidents} tone={openIncidents ? "danger" : "default"} href="/admin/privacy/incidents" />
          <StatCard label="Upcoming retention actions" value={upcoming} hint={upcoming ? upcomingRetention.map((u) => `${u.count} ${u.label}`).join(", ") : "No policy is switched on yet"} href="/admin/privacy/retention" />
        </div>
      </section>

      <section aria-labelledby="proc-h" className="mb-6">
        <h2 id="proc-h" className="mb-3 text-sm font-semibold tracking-wide text-muted uppercase">Processors and children</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active processors" value={processors.active} hint={`${processors.total} listed`} href="/admin/privacy/processors" />
          <StatCard label="Agreements not signed" value={processors.contractPending} tone={processors.contractPending ? "warning" : "default"} />
          <StatCard label="Under-18 accounts" value={children.minorDeclaredAccounts} href="/admin/privacy/children" />
          <StatCard label="Parent checks waiting" value={children.pendingParentalRequests} tone={children.pendingParentalRequests ? "warning" : "default"} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="To do before launch">
          {todo.length === 0 ? (
            <p className="text-sm text-muted">Nothing outstanding in the checks this page can see. Legal review is still required: see the compliance checklist document.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {todo.map((t) => (
                <li key={t.text}>
                  <Link href={t.href} className="font-medium text-brand underline underline-offset-4">{t.text}</Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">Privacy audit trail entries: {auditEntries}. <Link href="/admin/privacy/audit" className="font-medium text-brand underline underline-offset-4">Open the trail</Link></p>
        </Panel>
        <Panel title="When the DPDP Rules apply (orientation only)">
          <dl className="space-y-3 text-sm">
            {TIMELINE.map(([d, t]) => (
              <div key={d}>
                <dt className="font-semibold">{d}</dt>
                <dd className="text-muted">{t}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">This is not legal advice and not a statement that BeaverLab complies. Confirm dates and your own obligations against the Gazette notifications with an Indian legal professional.</p>
        </Panel>
      </div>
    </>
  );
}
