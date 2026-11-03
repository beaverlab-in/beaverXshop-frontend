"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DataTable, ErrorBanner, Modal, PageHeader, Panel, formatDateTime } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { formatMobile } from "@/lib/validation";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

export default function Team() {
  const toast = useToast();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data, loading, error, reload } = useAdminList("/team");
  const roles = useAdminList("/team/roles");
  const [dialog, setDialog] = useState(null); // {mode: "grant"} | {mode: "role", member}
  const [form, setForm] = useState({ mobile: "", name: "", roleKey: "admin" });
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [reauth, setReauth] = useState(false);

  async function submit(fn, message) {
    setBusy(true);
    setFormError("");
    setReauth(false);
    try {
      await fn();
      toast.success(message);
      setDialog(null);
      reload();
    } catch (e) {
      if (e.code === "REAUTH_REQUIRED") setReauth(true);
      setFormError(e.fields ? Object.values(e.fields).join(" ") : e.message);
    } finally {
      setBusy(false);
    }
  }

  const open = (d, initial) => { setForm(initial); setFormError(""); setReauth(false); setDialog(d); };
  const roleOptions = roles.data ?? [];

  return (
    <>
      <PageHeader title="Team" description="Staff use the same mobile + OTP login as customers. A role is added to their account; their shopping account stays untouched."
        actions={<Button onClick={() => open({ mode: "grant" }, { mobile: "", name: "", roleKey: "admin" })}>Add team member</Button>} />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <DataTable
          caption="Team"
          rows={data}
          loading={loading}
          empty="No staff yet."
          columns={[
            { key: "name", header: "Member", render: (m) => <><span className="font-semibold">{m.name || "No name yet"}</span>{m.id === user.id && <Badge tone="info" className="ml-2">You</Badge>}<br /><span className="text-xs text-muted">{formatMobile(m.mobile)}</span></> },
            { key: "role", header: "Role", render: (m) => <Badge tone="neutral">{m.role?.label}</Badge> },
            { key: "lastLoginAt", header: "Last login", render: (m) => (m.lastLoginAt ? formatDateTime(m.lastLoginAt) : "Hasn't logged in yet") },
            { key: "actions", header: "", align: "right", render: (m) => m.id !== user.id && <Button size="sm" variant="secondary" onClick={() => open({ mode: "role", member: m }, { ...form, roleKey: m.role?.key ?? "admin" })}>Change role</Button> },
          ]}
        />
      </Panel>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {roleOptions.map((r) => (
          <Panel key={r.key} title={r.label}>
            <p className="text-sm text-muted">{r.permissions.length} permissions</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{r.permissions.join(", ")}</p>
          </Panel>
        ))}
      </div>

      <Modal open={dialog?.mode === "grant"} onClose={() => setDialog(null)} title="Add team member"
        footer={<><Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={() => submit(() => admin.post("/team", { mobile: form.mobile, roleKey: form.roleKey, ...(form.name ? { name: form.name } : {}) }), "Team member added.")}>Add</Button></>}>
        <div className="space-y-4">
          <Field label="Mobile number" type="tel" inputMode="tel" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} hint="They sign in with this number and a one-time code." />
          <Field label="Name" optional value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Field as="select" label="Role" value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>{roleOptions.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</Field>
          {formError && <p role="alert" className="text-sm font-medium text-danger">{formError}</p>}
          {reauth && <p className="rounded-md bg-accent/15 p-3 text-sm">For your security this needs a fresh sign-in. <button type="button" className="font-semibold text-brand underline underline-offset-4" onClick={async () => { await signOut(); router.replace("/login?next=/admin/team"); }}>Sign in again</button></p>}
        </div>
      </Modal>

      <Modal open={dialog?.mode === "role"} onClose={() => setDialog(null)} title={`Change role: ${dialog?.member?.name || formatMobile(dialog?.member?.mobile)}`}
        footer={<>
          <Button variant="ghost" className="mr-auto text-danger hover:bg-danger/10" disabled={busy} onClick={() => submit(() => admin.patch(`/team/${dialog.member.id}`, { roleKey: null }), "Admin access removed.")}>Remove admin access</Button>
          <Button variant="ghost" onClick={() => setDialog(null)} disabled={busy}>Cancel</Button>
          <Button loading={busy} onClick={() => submit(() => admin.patch(`/team/${dialog.member.id}`, { roleKey: form.roleKey }), "Role updated.")}>Save role</Button>
        </>}>
        <Field as="select" label="Role" value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value })}>{roleOptions.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}</Field>
        <p className="mt-3 text-sm text-muted">Removing access only removes the staff role. Their shopper account, orders and addresses stay.</p>
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-danger">{formError}</p>}
        {reauth && <p className="mt-3 rounded-md bg-accent/15 p-3 text-sm">For your security this needs a fresh sign-in. <button type="button" className="font-semibold text-brand underline underline-offset-4" onClick={async () => { await signOut(); router.replace("/login?next=/admin/team"); }}>Sign in again</button></p>}
      </Modal>
    </>
  );
}
