"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/Layout";
import { useToast } from "@/providers/ToastProvider";

/** Runs an admin action with a busy flag, a success toast, and a clear prompt when a fresh login code is needed (step-up). */
export function useRun() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [reauth, setReauth] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(
    async (fn, success) => {
      setBusy(true);
      setReauth(false);
      setError(null);
      try {
        const out = await fn();
        if (success) toast.success(success);
        return out;
      } catch (e) {
        if (e.code === "REAUTH_REQUIRED") setReauth(true);
        else setError(e);
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );
  return { run, busy, reauth, error, clear: () => (setError(null), setReauth(false)) };
}

export function StepUpNotice() {
  const pathname = usePathname();
  return (
    <div role="alert" className="mb-4 rounded-md border border-warning/40 bg-warning/10 p-4 text-sm">
      <p className="font-semibold">Confirm it&apos;s you</p>
      <p className="mt-1">This action needs a fresh login code (it can change or reveal personal data). You will come back to this page afterwards.</p>
      <Button href={`/login?reauth=1&next=${encodeURIComponent(pathname)}`} size="sm" className="mt-3">Log in with a new code</Button>
    </div>
  );
}

export function ActionError({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="mb-4 rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">
      {error.message}
      {error.fields && Object.values(error.fields).length ? `: ${Object.values(error.fields).join(" ")}` : ""}
    </p>
  );
}

export const REQUEST_STATUS_TONE = { submitted: "info", under_review: "info", more_information_required: "warning", approved: "success", rejected: "danger", completed: "success" };
export const statusLabel = (s) => String(s ?? "").replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());

export function StatusPill({ status }) {
  return <Badge tone={REQUEST_STATUS_TONE[status] ?? "neutral"}>{statusLabel(status)}</Badge>;
}

export const PURPOSE_LABELS = {
  marketing_whatsapp: "Offers on WhatsApp",
  marketing_email: "Offers by email",
  analytics: "Analytics",
};

export const TYPES = ["ACCESS", "CORRECTION", "ERASURE", "CONSENT_WITHDRAWAL", "GRIEVANCE", "NOMINATION"];
export const typeLabel = (t) => statusLabel(String(t).toLowerCase());

export const NEXT_STATUSES = {
  submitted: ["under_review", "more_information_required", "approved", "rejected"],
  under_review: ["more_information_required", "approved", "rejected"],
  more_information_required: ["under_review", "approved", "rejected"],
  approved: ["completed", "under_review"],
  rejected: ["completed"],
  completed: [],
};

/** Small labelled value used in detail dialogs. */
export function Info({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm">{children || <span className="text-muted">Not recorded</span>}</dd>
    </div>
  );
}
