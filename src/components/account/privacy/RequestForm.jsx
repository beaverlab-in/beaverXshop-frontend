"use client";

import { useState } from "react";
import { Modal } from "@/components/admin/ui";
import { ReauthNotice, isReauth } from "@/components/account/privacy/shared";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { createPrivacyRequest } from "@/lib/client/privacyApi";
import { useToast } from "@/providers/ToastProvider";

const COPY = {
  ACCESS: { title: "Ask what personal data we hold", intro: "We will send you a summary of the personal data we process about you, what we use it for, and who we share it with.", submit: "Send request" },
  CORRECTION: { title: "Correct my personal data", intro: "Tell us what is wrong or incomplete. Name and email can be corrected on your account; for anything else, describe it below.", submit: "Send request" },
  ERASURE: { title: "Erase my personal data", intro: "We will erase or anonymise your account data when we can. Orders, invoices and payment records must be kept for the period tax and accounting laws require, so those stay (restricted to the staff who need them). We cannot erase while an order is still being delivered.", submit: "Request erasure" },
  NOMINATION: { title: "Nominate someone to act for me", intro: "You can nominate another person to exercise your rights if you die or become unable to. We will check the details with you before recording it.", submit: "Send nomination" },
  GRIEVANCE: { title: "Send a grievance", intro: "Tell us about a concern with how your personal data is handled. We reply within the period shown on this page.", submit: "Send grievance" },
};

/** One form for every request type. Everything except a grievance needs a fresh login code (the server checks it). */
export default function RequestForm({ type, open, onClose, onCreated }) {
  const toast = useToast();
  const [v, setV] = useState({});
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [reauth, setReauth] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const copy = COPY[type];
  const set = (k) => (e) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    setErrors({});
    setReauth(false);
    try {
      const created = await createPrivacyRequest({ type, ...Object.fromEntries(Object.entries(v).filter(([, x]) => String(x).trim())) });
      toast.success(`Request ${created.requestId} sent.`);
      setV({});
      setConfirmed(false);
      onCreated?.(created);
      onClose();
    } catch (e) {
      if (isReauth(e)) setReauth(true);
      else setErrors({ form: e.message, ...(e.fields ?? {}) });
    } finally {
      setBusy(false);
    }
  }

  if (!copy) return null;
  return (
    <Modal
      open={open}
      title={copy.title}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={type === "ERASURE" && !confirmed}>{copy.submit}</Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{copy.intro}</p>
      <div className="mt-4 space-y-4">
        {reauth && <ReauthNotice onDismiss={() => setReauth(false)} />}
        {errors.form && <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">{errors.form}</p>}

        {type === "GRIEVANCE" && (
          <>
            <Field label="Short title" value={v.subject ?? ""} onChange={set("subject")} error={errors.subject} />
            <Field label="What happened?" as="textarea" value={v.details ?? ""} onChange={set("details")} error={errors.details} />
          </>
        )}
        {type === "ACCESS" && <Field label="Anything specific you want to know?" optional as="textarea" value={v.details ?? ""} onChange={set("details")} error={errors.details} />}
        {type === "CORRECTION" && (
          <>
            <Field label="Correct name" optional value={v.name ?? ""} onChange={set("name")} error={errors.name} />
            <Field label="Correct email" optional type="email" value={v.email ?? ""} onChange={set("email")} error={errors.email} />
            <Field label="Anything else that is wrong" optional as="textarea" value={v.details ?? ""} onChange={set("details")} error={errors.details} />
          </>
        )}
        {type === "ERASURE" && (
          <>
            <Field label="Why are you asking? (optional)" optional as="textarea" value={v.details ?? ""} onChange={set("details")} error={errors.details} />
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 size-5 shrink-0 accent-brand" />
              <span>I understand that my account, saved addresses and optional consents will be erased or anonymised, and that I will be logged out. Records the law requires us to keep will stay.</span>
            </label>
          </>
        )}
        {type === "NOMINATION" && (
          <>
            <Field label="Nominee's name" value={v.nomineeName ?? ""} onChange={set("nomineeName")} error={errors.nomineeName} />
            <Field label="Relationship to you" value={v.relationship ?? ""} onChange={set("relationship")} error={errors.relationship} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nominee's mobile" optional type="tel" value={v.nomineeMobile ?? ""} onChange={set("nomineeMobile")} error={errors.nomineeMobile} />
              <Field label="Nominee's email" optional type="email" value={v.nomineeEmail ?? ""} onChange={set("nomineeEmail")} error={errors.nomineeEmail} />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
