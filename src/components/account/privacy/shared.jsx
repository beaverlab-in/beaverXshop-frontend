"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Layout";
import { IS_DEMO } from "@/lib/env";

export const fmtDate = (iso) => (iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso)) : "");
export const fmtDateTime = (iso) => (iso ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : "");

export const STATUS_LABEL = {
  submitted: "Submitted",
  under_review: "Under review",
  more_information_required: "More information required",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};
export const STATUS_TONE = { submitted: "info", under_review: "info", more_information_required: "warning", approved: "success", rejected: "danger", completed: "success" };

export const TYPE_LABEL = {
  ACCESS: "Information about my data",
  CORRECTION: "Correction",
  ERASURE: "Erasure",
  CONSENT_WITHDRAWAL: "Consent withdrawal",
  GRIEVANCE: "Grievance",
  NOMINATION: "Nomination",
};

export function StatusBadge({ status }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{STATUS_LABEL[status] ?? status}</Badge>;
}

const tabs = [
  { href: "/account/privacy", label: "Overview", exact: true },
  { href: "/account/privacy/requests", label: "My requests" },
  { href: "/account/privacy/consents", label: "Consents" },
  { href: "/account/privacy/grievances", label: "Grievances" },
];

export function PrivacyTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Privacy sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`-mb-px min-h-11 shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${active ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Every privacy screen needs the live backend: consents, requests and notices are stored there. */
export function DemoUnavailable() {
  return (
    <div className="rounded-card border border-dashed border-line bg-surface p-8">
      <h2 className="text-xl font-semibold">Available when the store is connected</h2>
      <p className="mt-2 text-muted">
        This is the demo version of the website, so there is no server to keep your privacy requests, consents or notices. In the live store this page lets you see your data, manage optional consents, and send requests and grievances.
      </p>
    </div>
  );
}

export const needsBackend = IS_DEMO;

/** Shown when an action needs a fresh one-time code (identity check). */
export function ReauthNotice({ onDismiss }) {
  const pathname = usePathname();
  return (
    <div role="alert" className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
      <p className="font-semibold">Please confirm it&apos;s you</p>
      <p className="mt-1">For your safety, this needs a fresh login code. It takes a moment, and you will come straight back here.</p>
      <div className="mt-3 flex gap-2">
        <Button href={`/login?reauth=1&next=${encodeURIComponent(pathname)}`} size="sm">Confirm with a new code</Button>
        {onDismiss && <Button variant="ghost" size="sm" onClick={onDismiss}>Not now</Button>}
      </div>
    </div>
  );
}

export const isReauth = (err) => err?.code === "REAUTH_REQUIRED";
