"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Card } from "@/components/ui/Layout";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { formatMobile, isValidEmail } from "@/lib/validation";

export default function SettingsView() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  // Only edits live in state; the rest follows the signed-in user (hidden pages stay mounted, so copying would go stale).
  const [edits, setEdits] = useState({});
  const form = { name: edits.name ?? user?.name ?? "", email: edits.email ?? user?.email ?? "" };
  const setForm = (next) => setEdits({ name: next.name, email: next.email });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Please enter your name.";
    if (form.email && !isValidEmail(form.email)) found.email = "Enter a valid email address or leave it blank.";
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await updateProfile(form);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-brand">Account settings</h1>
      <Card className="mt-6 max-w-xl p-6 sm:p-8">
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <Field label="Mobile number" value={formatMobile(user?.mobile)} readOnly disabled hint="Your mobile number is verified and can't be changed here." />
          <Field label="Full name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
          <Field label="Email" optional type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
          <Button type="submit" loading={busy}>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
