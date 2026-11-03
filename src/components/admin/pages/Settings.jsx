"use client";

import { useState } from "react";
import { ErrorBanner, Modal, PageHeader, Panel, Tabs, formatDate } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import { Skeleton } from "@/components/ui/States";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { LEGAL_PAGES } from "@/lib/constants";
import { INDIAN_STATES } from "@/lib/india";
import { paiseToRupeesInput, rupeesInputToPaise } from "@/lib/money";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const TABS = [
  { value: "company", label: "Company" },
  { value: "commerce", label: "Tax, shipping & COD" },
  { value: "invoice", label: "Invoices" },
  { value: "legal", label: "Legal pages" },
  { value: "seo", label: "SEO" },
  { value: "integrations", label: "Integrations" },
];

/** Saves one section of the settings. `build()` returns { body } or { problems }. */
function useSave(reload) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  async function save(body, message = "Settings saved.") {
    setBusy(true);
    setErrors({});
    try {
      await admin.patch("/settings", body);
      toast.success(message);
      reload();
      return true;
    } catch (e) {
      setErrors(e.fields ?? { form: e.message });
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { save, busy, errors, setErrors };
}

function CompanyTab({ s, canWrite, reload }) {
  const c = s.company;
  const [f, setF] = useState({ tradeName: c.tradeName, legalName: c.legalName, gstin: c.gstin, address: c.address, stateCode: c.stateCode, supportEmail: c.supportEmail, supportPhone: c.supportPhone, supportHours: c.supportHours, logoKey: c.logoKey, ...c.social });
  const { save, busy, errors } = useSave(reload);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const e = (k) => errors[`company.${k}`] ?? errors[`company.social.${k}`];
  const submit = (ev) => {
    ev.preventDefault();
    const { instagram, youtube, linkedin, x, facebook, ...company } = f;
    save({ company: { ...company, social: { instagram, youtube, linkedin, x, facebook } } });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Panel title="Business identity (printed on invoices)">
        <p className="mb-4 text-sm text-muted">Nothing here is pre-filled or invented. Orders need the state code; invoices need legal name, GSTIN, address and state code.</p>
        <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
          <Field label="Trade / brand name" value={f.tradeName} onChange={set("tradeName")} error={e("tradeName")} />
          <Field label="Legal business name" value={f.legalName} onChange={set("legalName")} error={e("legalName")} />
          <Field label="GSTIN" value={f.gstin} onChange={(ev) => setF({ ...f, gstin: ev.target.value.toUpperCase() })} error={e("gstin")} hint="15 characters, e.g. 27AAPFU0939F1ZV." />
          <Field as="select" label="State (GST state code)" value={f.stateCode} onChange={set("stateCode")} error={e("stateCode")} hint="Decides CGST+SGST vs IGST.">
            <option value="">Select…</option>
            {INDIAN_STATES.map((s2) => <option key={s2.code} value={s2.code}>{s2.code} · {s2.name}</option>)}
          </Field>
          <Field as="textarea" label="Registered address" value={f.address} onChange={set("address")} error={e("address")} className="sm:col-span-2" />
          <Field label="Logo (media key or https link)" optional value={f.logoKey} onChange={set("logoKey")} error={e("logoKey")} className="sm:col-span-2" />
        </fieldset>
      </Panel>
      <Panel title="Store contact (shown in the footer and contact page)">
        <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
          <Field label="Support email" optional type="email" value={f.supportEmail} onChange={set("supportEmail")} error={e("supportEmail")} />
          <Field label="Support phone" optional value={f.supportPhone} onChange={set("supportPhone")} error={e("supportPhone")} />
          <Field label="Support hours" optional value={f.supportHours} onChange={set("supportHours")} error={e("supportHours")} className="sm:col-span-2" />
          {["instagram", "youtube", "linkedin", "x", "facebook"].map((k) => <Field key={k} label={`${k[0].toUpperCase()}${k.slice(1)} link`} optional type="url" placeholder="https://" value={f[k]} onChange={set(k)} error={e(k)} />)}
        </fieldset>
      </Panel>
      {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
      {canWrite && <Button type="submit" loading={busy}>Save company details</Button>}
    </form>
  );
}

function CommerceTab({ s, canWrite, reload }) {
  const m = s.commerce;
  const [f, setF] = useState({ include: m.pricesIncludeGst, taxFees: m.taxShippingAndFees, sac: m.shippingSac, flat: paiseToRupeesInput(m.shipping.flatPaise), free: paiseToRupeesInput(m.shipping.freeAbovePaise), cod: m.cod.enabled, codFee: paiseToRupeesInput(m.cod.feePaise), codMax: paiseToRupeesInput(m.cod.maxOrderPaise) });
  const { save, busy, errors, setErrors } = useSave(reload);
  const submit = (ev) => {
    ev.preventDefault();
    const flat = rupeesInputToPaise(f.flat || "0");
    const free = rupeesInputToPaise(f.free || "0");
    const fee = rupeesInputToPaise(f.codFee || "0");
    const max = rupeesInputToPaise(f.codMax || "0");
    if ([flat, free, fee, max].includes(null)) return setErrors({ form: "Amounts must look like 60 or 60.50." });
    save({ commerce: { pricesIncludeGst: f.include, taxShippingAndFees: f.taxFees, shippingSac: f.sac, shipping: { flatPaise: flat, freeAbovePaise: free }, cod: { enabled: f.cod, feePaise: fee, maxOrderPaise: max } } });
  };
  const radio = "flex min-h-11 cursor-pointer items-start gap-3 rounded-md border p-3";
  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <Panel title="How prices and GST work">
        <fieldset disabled={!canWrite} className="space-y-3">
          <legend className="sr-only">Price mode</legend>
          <label className={`${radio} ${f.include ? "border-brand bg-tint/40" : "border-line"}`}>
            <input type="radio" name="mode" checked={f.include} onChange={() => setF({ ...f, include: true })} className="mt-1 accent-brand" />
            <span><strong>Prices include GST</strong><br /><span className="text-sm text-muted">Customers pay exactly the listed price; GST is shown as contained in it.</span></span>
          </label>
          <label className={`${radio} ${!f.include ? "border-brand bg-tint/40" : "border-line"}`}>
            <input type="radio" name="mode" checked={!f.include} onChange={() => setF({ ...f, include: false })} className="mt-1 accent-brand" />
            <span><strong>Prices exclude GST</strong><br /><span className="text-sm text-muted">GST is added on top at checkout.</span></span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 pt-2">
            <input type="checkbox" checked={f.taxFees} onChange={(e) => setF({ ...f, taxFees: e.target.checked })} className="mt-1 size-5 accent-brand" />
            <span>Charge GST on shipping and COD fees<br /><span className="text-sm text-muted">At the highest rate among the products in the order. Confirm with your CA.</span></span>
          </label>
          <Field label="SAC / HSN for shipping lines on invoices" optional value={f.sac} onChange={(e) => setF({ ...f, sac: e.target.value })} error={errors["commerce.shippingSac"]} hint="Leave blank unless your CA gives you a code." className="max-w-sm" />
        </fieldset>
        <p className="mt-4 text-sm text-muted">Changes apply to new orders only. Existing orders and invoices keep the tax they were created with.</p>
      </Panel>
      <Panel title="Shipping charges">
        <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
          <Field label="Flat shipping charge (₹)" inputMode="decimal" value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} error={errors["commerce.shipping.flatPaise"]} hint="0 = free shipping always." />
          <Field label="Free shipping above (₹)" inputMode="decimal" value={f.free} onChange={(e) => setF({ ...f, free: e.target.value })} error={errors["commerce.shipping.freeAbovePaise"]} hint="0 = no free-shipping threshold." />
        </fieldset>
      </Panel>
      <Panel title="Cash on delivery">
        <fieldset disabled={!canWrite} className="space-y-4">
          <label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={f.cod} onChange={(e) => setF({ ...f, cod: e.target.checked })} className="size-5 accent-brand" /><span>Offer cash on delivery</span></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="COD handling fee (₹)" inputMode="decimal" value={f.codFee} onChange={(e) => setF({ ...f, codFee: e.target.value })} error={errors["commerce.cod.feePaise"]} disabled={!f.cod} />
            <Field label="Maximum COD order value (₹)" inputMode="decimal" value={f.codMax} onChange={(e) => setF({ ...f, codMax: e.target.value })} error={errors["commerce.cod.maxOrderPaise"]} disabled={!f.cod} hint="0 = no limit." />
          </div>
        </fieldset>
      </Panel>
      {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
      {canWrite && <Button type="submit" loading={busy}>Save</Button>}
    </form>
  );
}

function InvoiceTab({ s, canWrite, reload }) {
  const [f, setF] = useState({ prefix: s.invoice.prefix, termsText: s.invoice.termsText });
  const { save, busy, errors } = useSave(reload);
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); save({ invoice: f }); }} noValidate className="space-y-6">
      <Panel title="Invoice numbering and terms">
        <fieldset disabled={!canWrite} className="space-y-4">
          <Field label="Invoice prefix" value={f.prefix} onChange={(e) => setF({ ...f, prefix: e.target.value.toUpperCase() })} error={errors["invoice.prefix"]} hint="Up to 3 letters or digits (default INV). Numbers look like INV/26-27/000001 and restart each financial year. GST rules limit them to 16 characters." className="max-w-sm" />
          <Field as="textarea" label="Terms printed on invoices" optional value={f.termsText} onChange={(e) => setF({ ...f, termsText: e.target.value })} error={errors["invoice.termsText"]} />
        </fieldset>
      </Panel>
      {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
      {canWrite && <Button type="submit" loading={busy}>Save</Button>}
    </form>
  );
}

function LegalTab({ s, canWrite, reload }) {
  const [editing, setEditing] = useState(null);
  const { save, busy, errors } = useSave(reload);
  return (
    <Panel title="Legal pages" padded={false}>
      <p className="px-5 pt-4 text-sm text-muted">Write each policy yourself. The system never invents legal text, company details or warranty terms. Unpublished pages show a &ldquo;not published yet&rdquo; notice and are hidden from search engines. Use <code>## Heading</code> lines and blank lines between paragraphs.</p>
      <ul className="divide-y divide-line">
        {LEGAL_PAGES.map((p) => {
          const entry = s.legalPages[p.slug];
          return (
            <li key={p.slug} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted">{entry ? `Published · updated ${formatDate(entry.updatedAt)}` : "Not published yet"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={entry ? "success" : "warning"}>{entry ? "Published" : "Draft"}</Badge>
                {canWrite && <Button size="sm" variant="secondary" onClick={() => setEditing({ slug: p.slug, title: entry?.title ?? p.title, markdown: entry?.markdown ?? "" })}>{entry ? "Edit" : "Write"}</Button>}
              </div>
            </li>
          );
        })}
      </ul>
      <Modal open={Boolean(editing)} wide onClose={() => setEditing(null)} title={editing?.title ?? ""}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={async () => { if (await save({ legalPage: editing }, "Page published.")) setEditing(null); }}>Publish</Button></>}>
        {editing && (
          <div className="space-y-4">
            <Field label="Page title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} error={errors["legalPage.title"]} />
            <Field as="textarea" label="Content" value={editing.markdown} onChange={(e) => setEditing({ ...editing, markdown: e.target.value })} error={errors["legalPage.markdown"]} className="[&_textarea]:!min-h-80 [&_textarea]:font-mono" />
            {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
          </div>
        )}
      </Modal>
    </Panel>
  );
}

function SeoTab({ s, canWrite, reload }) {
  const [f, setF] = useState({ defaultTitle: s.seo.defaultTitle, defaultDescription: s.seo.defaultDescription });
  const { save, busy, errors } = useSave(reload);
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); save({ seo: f }); }} noValidate className="space-y-6">
      <Panel title="Default search appearance">
        <fieldset disabled={!canWrite} className="space-y-4">
          <Field label="Default title" optional value={f.defaultTitle} onChange={(e) => setF({ ...f, defaultTitle: e.target.value })} error={errors["seo.defaultTitle"]} hint="Up to 70 characters." />
          <Field as="textarea" label="Default description" optional value={f.defaultDescription} onChange={(e) => setF({ ...f, defaultDescription: e.target.value })} error={errors["seo.defaultDescription"]} hint="Up to 170 characters. Individual products can override it." />
        </fieldset>
      </Panel>
      {canWrite && <Button type="submit" loading={busy}>Save</Button>}
    </form>
  );
}

function IntegrationRow({ name, ok, children }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
      <div><p className="font-semibold">{name}</p><p className="mt-1 text-sm text-muted">{children}</p></div>
      <Badge tone={ok ? "success" : "warning"}>{ok ? "Connected" : "Not connected"}</Badge>
    </li>
  );
}

function IntegrationsTab() {
  const { data, error, reload } = useAdminList("/settings/integrations");
  if (!data) return error ? <ErrorBanner error={error} onRetry={reload} /> : <Skeleton className="h-48" />;
  return (
    <Panel title="Integrations" padded={false}>
      <ul className="divide-y divide-line">
        <IntegrationRow name="Razorpay payments" ok={data.razorpay.configured}>{data.razorpay.configured ? `Key ${data.razorpay.keyIdPreview}. Webhook secret ${data.razorpay.webhookSecretSet ? "is set" : "is NOT set: payments will not be confirmed reliably"}.` : "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the server environment. Until then, customers can only pay by cash on delivery (if enabled)."}</IntegrationRow>
        <IntegrationRow name="WhatsApp (OTP and order messages)" ok={data.whatsapp.configured}>{data.whatsapp.note} Login code mode: <strong>{data.whatsapp.otpMode}</strong>.</IntegrationRow>
        <IntegrationRow name="Shipping" ok={data.shipping.configured}>{data.shipping.note}</IntegrationRow>
        <IntegrationRow name="Media storage (Cloudflare R2)" ok={data.storage.configured}>{data.storage.configured ? data.storage.mediaBaseUrl : "MEDIA_BASE_URL is not set. Images are referenced by link or key."}</IntegrationRow>
      </ul>
      <p className="px-5 py-4 text-xs text-muted">Secrets are never shown here. They live only in the server environment.</p>
    </Panel>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const canWrite = user.permissions.includes("settings:write");
  const { data, error, reload } = useAdminList("/settings");
  const [tab, setTab] = useState("company");
  return (
    <>
      <PageHeader title="Store settings" description={canWrite ? "These settings drive the storefront, checkout and invoices." : "You can view these settings but not change them."} />
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="Settings sections" />
      <ErrorBanner error={error} onRetry={reload} />
      {!data ? <Skeleton className="h-96" /> : (
        <>
          {/* `key` remounts a tab with the freshly saved values after each reload */}
          {tab === "company" && <CompanyTab key={JSON.stringify(data.company)} s={data} canWrite={canWrite} reload={reload} />}
          {tab === "commerce" && <CommerceTab key={JSON.stringify(data.commerce)} s={data} canWrite={canWrite} reload={reload} />}
          {tab === "invoice" && <InvoiceTab key={JSON.stringify(data.invoice)} s={data} canWrite={canWrite} reload={reload} />}
          {tab === "legal" && <LegalTab s={data} canWrite={canWrite} reload={reload} />}
          {tab === "seo" && <SeoTab key={JSON.stringify(data.seo)} s={data} canWrite={canWrite} reload={reload} />}
          {tab === "integrations" && <IntegrationsTab />}
        </>
      )}
    </>
  );
}
