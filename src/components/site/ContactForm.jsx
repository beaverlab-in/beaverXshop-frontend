"use client";

import { useActionState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/Icons";
import { submitContactAction } from "@/app/actions/contact";

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactAction, null);

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
    <form action={formAction} noValidate className="space-y-4">
      {errors.form && (
        <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger">
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
      <Button type="submit" size="lg" loading={pending}>
        Send message
      </Button>
    </form>
  );
}
