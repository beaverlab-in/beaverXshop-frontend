"use client";

import { useState } from "react";
import CollectionNotice, { useCollectionNotice } from "@/components/account/privacy/CollectionNotice";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Icons";
import { submitContact } from "@/lib/client/privacyApi";
import { IS_DEMO } from "@/lib/env";
import { isValidEmail, normalizeMobile } from "@/lib/validation";

/**
 * Support contact form. It is sent from the browser (not a server action) so that, when you are signed in, your session links the
 * message to your account. That is what lets an access, correction or erasure request find it later.
 */
export default function ContactForm() {
  const notice = useCollectionNotice();
  const [state, setState] = useState(null); // null | { ok, demo } | { errors, values }
  const [pending, setPending] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = { name: String(fd.get("name") ?? "").trim(), email: String(fd.get("email") ?? "").trim(), mobile: String(fd.get("mobile") ?? "").trim(), message: String(fd.get("message") ?? "").trim() };
    if (String(fd.get("website") ?? "")) return setState({ ok: true, demo: false }); // bots: pretend success, send nothing

    const errors = {};
    if (values.name.length < 2) errors.name = "Please tell us your name.";
    if (!isValidEmail(values.email)) errors.email = "Enter a valid email address.";
    if (values.mobile && !normalizeMobile(values.mobile)) errors.mobile = "Enter a valid 10-digit mobile number or leave it blank.";
    if (values.message.length < 10) errors.message = "Please write at least a short sentence (10 characters).";
    if (Object.keys(errors).length) return setState({ errors, values });

    if (IS_DEMO) return setState({ ok: true, demo: true });
    setPending(true);
    try {
      await submitContact({ name: values.name, email: values.email, mobile: normalizeMobile(values.mobile) || undefined, message: values.message, noticeVersion: notice?.version });
      setState({ ok: true, demo: false });
    } catch (err) {
      setState({ errors: { form: err.status === 429 ? "Too many messages from this device. Please try again later." : "We couldn't send your message right now. Please try again in a moment." }, values });
    } finally {
      setPending(false);
    }
  }

  if (state?.ok) {
    return (
      <div role="status" className="rounded-card border border-success/30 bg-success/10 p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-success text-white">
          <CheckIcon className="size-6" />
        </span>
        <h2 className="mt-4 text-2xl font-bold">{state.demo ? "Form checked" : "Message sent"}</h2>
        <p className="mt-2 text-muted">
          {state.demo
            ? "Demo mode: your message was validated but not sent, because the contact service isn't connected yet."
            : "Thanks for getting in touch. We'll reply as soon as we can."}
        </p>
      </div>
    );
  }

  const errors = state?.errors ?? {};
  const v = state?.values ?? {};
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {errors.form && (
        <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" name="name" autoComplete="name" defaultValue={v.name} error={errors.name} />
        <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={v.email} error={errors.email} />
      </div>
      <Field label="Mobile number" optional name="mobile" type="tel" autoComplete="tel-national" defaultValue={v.mobile} error={errors.mobile} />
      <Field label="Message" name="message" as="textarea" defaultValue={v.message} error={errors.message} />
      {/* Honeypot: hidden from people, tempting to bots */}
      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <CollectionNotice context="contact" />
      <Button type="submit" size="lg" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
