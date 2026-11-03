"use client";

import { useState } from "react";
import { ConfirmDialog, DataTable, ErrorBanner, Modal, PageHeader, Panel, formatDate } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { formatINR, paiseToRupeesInput, rupeesInputToPaise } from "@/lib/money";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const blank = { code: "", type: "percent", value: "10", minOrder: "", maxDiscount: "", startsAt: "", expiresAt: "", usageLimit: "", perUserLimit: "", active: true };
const toDay = (iso) => (iso ? iso.slice(0, 10) : "");

function status(c) {
  const now = Date.now();
  if (!c.active) return ["neutral", "Inactive"];
  if (c.expiresAt && new Date(c.expiresAt) < now) return ["danger", "Expired"];
  if (c.startsAt && new Date(c.startsAt) > now) return ["warning", "Scheduled"];
  if (c.usageLimit > 0 && c.usedCount >= c.usageLimit) return ["warning", "Used up"];
  return ["success", "Active"];
}

export default function Coupons() {
  const toast = useToast();
  const { user } = useAuth();
  const canWrite = user.permissions.includes("coupons:write");
  const { data, loading, error, reload } = useAdminList("/coupons");
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save() {
    const minOrder = form.minOrder ? rupeesInputToPaise(form.minOrder) : 0;
    const maxDiscount = form.maxDiscount ? rupeesInputToPaise(form.maxDiscount) : 0;
    const fixedValue = form.type === "fixed" ? rupeesInputToPaise(form.value) : Number(form.value);
    const problems = {};
    if (minOrder === null) problems.minOrderPaise = "Enter an amount like 499.";
    if (maxDiscount === null) problems.maxDiscountPaise = "Enter an amount like 200.";
    if (fixedValue === null || !Number.isFinite(fixedValue) || fixedValue < 1) problems.value = form.type === "fixed" ? "Enter an amount like 100." : "Enter a whole percentage.";
    if (Object.keys(problems).length) return setErrors(problems);
    setBusy(true);
    setErrors({});
    const body = {
      value: form.type === "percent" ? Math.round(fixedValue) : fixedValue,
      minOrderPaise: minOrder, maxDiscountPaise: form.type === "percent" ? maxDiscount : 0,
      startsAt: form.startsAt || null, expiresAt: form.expiresAt ? `${form.expiresAt}T23:59:59+05:30` : null,
      usageLimit: Number(form.usageLimit) || 0, perUserLimit: Number(form.perUserLimit) || 0, active: form.active,
    };
    try {
      if (form.id) await admin.patch(`/coupons/${form.id}`, body);
      else await admin.post("/coupons", { code: form.code, type: form.type, ...body });
      toast.success("Coupon saved.");
      setForm(null);
      reload();
    } catch (e) {
      setErrors(e.fields ?? { form: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const r = await admin.del(`/coupons/${removing.id}`);
      toast.success(r.deactivated ? "Coupon was used, so it was deactivated instead." : "Coupon deleted.");
      setRemoving(null);
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const edit = (c) => {
    setErrors({});
    setForm({ id: c.id, code: c.code, type: c.type, value: c.type === "fixed" ? paiseToRupeesInput(c.value) : String(c.value), minOrder: c.minOrderPaise ? paiseToRupeesInput(c.minOrderPaise) : "", maxDiscount: c.maxDiscountPaise ? paiseToRupeesInput(c.maxDiscountPaise) : "", startsAt: toDay(c.startsAt), expiresAt: toDay(c.expiresAt), usageLimit: c.usageLimit ? String(c.usageLimit) : "", perUserLimit: c.perUserLimit ? String(c.perUserLimit) : "", active: c.active });
  };

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes customers can enter in the cart. A code and its type can't be changed once created." actions={canWrite && <Button onClick={() => { setErrors({}); setForm({ ...blank }); }}>New coupon</Button>} />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <DataTable
          caption="Coupons"
          rows={data}
          loading={loading}
          empty="No coupons yet."
          columns={[
            { key: "code", header: "Code", render: (c) => <span className="font-mono font-bold">{c.code}</span> },
            { key: "value", header: "Discount", render: (c) => (c.type === "percent" ? `${c.value}%${c.maxDiscountPaise ? ` (max ${formatINR(c.maxDiscountPaise)})` : ""}` : formatINR(c.value)) },
            { key: "minOrderPaise", header: "Min order", render: (c) => (c.minOrderPaise ? formatINR(c.minOrderPaise) : "—") },
            { key: "valid", header: "Valid", render: (c) => (c.startsAt || c.expiresAt ? `${c.startsAt ? formatDate(c.startsAt) : "now"} → ${c.expiresAt ? formatDate(c.expiresAt) : "no end"}` : "Always") },
            { key: "usedCount", header: "Used", align: "right", render: (c) => `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
            { key: "status", header: "Status", render: (c) => { const [t, l] = status(c); return <Badge tone={t}>{l}</Badge>; } },
            { key: "actions", header: "", align: "right", render: (c) => canWrite && <div className="flex justify-end gap-1"><Button size="sm" variant="secondary" onClick={() => edit(c)}>Edit</Button><Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setRemoving(c)}>Delete</Button></div> },
          ]}
        />
      </Panel>

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?.id ? `Edit ${form.code}` : "New coupon"}
        footer={<><Button variant="ghost" onClick={() => setForm(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={save}>Save coupon</Button></>}>
        {form && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} disabled={Boolean(form.id)} error={errors.code} hint="3 to 30 letters, digits, - or _." />
              <Field as="select" label="Type" value={form.type} onChange={set("type")} disabled={Boolean(form.id)}><option value="percent">Percentage off</option><option value="fixed">Fixed amount off</option></Field>
              <Field label={form.type === "percent" ? "Percent off" : "Amount off (₹)"} inputMode="decimal" value={form.value} onChange={set("value")} error={errors.value} />
              <Field label="Minimum order (₹)" optional inputMode="decimal" value={form.minOrder} onChange={set("minOrder")} error={errors.minOrderPaise} />
              {form.type === "percent" && <Field label="Maximum discount (₹)" optional inputMode="decimal" value={form.maxDiscount} onChange={set("maxDiscount")} error={errors.maxDiscountPaise} />}
              <Field label="Starts" optional type="date" value={form.startsAt} onChange={set("startsAt")} error={errors.startsAt} />
              <Field label="Ends (inclusive)" optional type="date" value={form.expiresAt} onChange={set("expiresAt")} error={errors.expiresAt} />
              <Field label="Total uses allowed" optional inputMode="numeric" value={form.usageLimit} onChange={set("usageLimit")} error={errors.usageLimit} hint="Blank = unlimited." />
              <Field label="Uses per customer" optional inputMode="numeric" value={form.perUserLimit} onChange={set("perUserLimit")} error={errors.perUserLimit} hint="Blank = unlimited." />
            </div>
            <label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="size-5 accent-brand" /><span>Active</span></label>
            {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
          </div>
        )}
      </Modal>
      <ConfirmDialog open={Boolean(removing)} danger title="Delete this coupon?" confirmLabel="Delete" busy={busy} onCancel={() => setRemoving(null)} onConfirm={remove} message={`“${removing?.code}” will be removed. If customers have already used it, it is only deactivated so past orders stay accurate.`} />
    </>
  );
}
