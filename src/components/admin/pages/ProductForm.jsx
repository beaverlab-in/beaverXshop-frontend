"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog, ErrorBanner, PageHeader, Panel } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/States";
import { PlusIcon, TrashIcon } from "@/components/ui/Icons";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { paiseToRupeesInput, rupeesInputToPaise } from "@/lib/money";
import { useToast } from "@/providers/ToastProvider";

const GST_RATES = [0, 5, 12, 18, 28];
const lines = (text) => text.split("\n").map((s) => s.trim()).filter(Boolean);

const blank = {
  title: "", slug: "", sku: "", categoryId: "", tagline: "", description: "", price: "", compareAt: "", gstRatePercent: "18", hsnCode: "",
  stock: "0", lowStockThreshold: "5", status: "draft", sortOrder: "0", isFeatured: false, isBestSeller: false, seoTitle: "", seoDescription: "", compatibility: "", warranty: "",
  features: "", whatYouCanBuild: "", learningOutcomes: "", boxContents: "", specifications: [], faqs: [], resources: [], images: [], relatedIds: [],
};

function fromProduct(p) {
  return {
    ...blank,
    title: p.title, slug: p.slug, sku: p.sku, categoryId: p.categoryId, tagline: p.tagline, description: p.description,
    price: paiseToRupeesInput(p.pricePaise), compareAt: p.compareAtPaise ? paiseToRupeesInput(p.compareAtPaise) : "",
    gstRatePercent: String(p.gstRateBp / 100), hsnCode: p.hsnCode, stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold),
    status: p.status, sortOrder: String(p.sortOrder), isFeatured: Boolean(p.isFeatured), isBestSeller: Boolean(p.isBestSeller), seoTitle: p.seo?.title ?? "", seoDescription: p.seo?.description ?? "",
    compatibility: p.compatibility, warranty: p.warranty,
    features: p.features.join("\n"), whatYouCanBuild: p.whatYouCanBuild.join("\n"), learningOutcomes: p.learningOutcomes.join("\n"), boxContents: p.boxContents.join("\n"),
    specifications: p.specifications.map((s) => ({ ...s })), faqs: p.faqs.map((f) => ({ ...f })), resources: p.resources.map((r) => ({ ...r })),
    images: p.images.map((i) => ({ key: i.key, alt: i.alt })), relatedIds: p.relatedIds,
  };
}

/** A small editor for rows of two fields (specifications, FAQs, resources). */
function PairList({ title, hint, rows, onChange, a, b, aLabel, bLabel }) {
  const set = (i, key, value) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold">{title}</legend>
      {hint && <p className="mb-2 text-xs text-muted">{hint}</p>}
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_1.4fr_auto]">
            <Field label={aLabel} value={r[a]} onChange={(e) => set(i, a, e.target.value)} />
            <Field label={bLabel} value={r[b]} onChange={(e) => set(i, b, e.target.value)} />
            <button type="button" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="mt-6 grid size-10 place-items-center self-start rounded-full text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Remove ${aLabel.toLowerCase()} ${i + 1}`}>
              <TrashIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button size="sm" variant="secondary" className="mt-3" onClick={() => onChange([...rows, { [a]: "", [b]: "" }])}>
        <PlusIcon className="size-4" /> Add
      </Button>
    </fieldset>
  );
}

export default function ProductForm({ id }) {
  const router = useRouter();
  const toast = useToast();
  const editing = Boolean(id);
  const product = useAdminList(`/products/${id}`, {}, { enabled: editing });
  const cats = useAdminList("/categories");
  const others = useAdminList("/products", { limit: 100 });

  if (editing && !product.data) return product.error ? <ErrorBanner error={product.error} onRetry={product.reload} /> : <Skeleton className="h-96" />;
  // The form mounts once the product is known, so its state starts from the saved values.
  return <Form key={editing ? product.data.id : "new"} initial={editing ? fromProduct(product.data) : blank} id={id} editing={editing} cats={cats.data ?? []} others={(others.data ?? []).filter((p) => p.id !== id)} router={router} toast={toast} />;
}

function Form({ initial, id, editing, cats, others, router, toast }) {
  const [f, setF] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [archiving, setArchiving] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const err = (...keys) => keys.map((k) => errors[k]).find(Boolean);

  function build() {
    const problems = {};
    const price = rupeesInputToPaise(f.price);
    const compareAt = f.compareAt.trim() ? rupeesInputToPaise(f.compareAt) : 0;
    if (price === null) problems.price = "Enter an amount like 1499 or 1499.50.";
    if (compareAt === null) problems.compareAt = "Enter an amount like 1999 or leave blank.";
    if (!f.categoryId) problems.categoryId = "Choose a category.";
    if (Object.keys(problems).length) return { problems };
    const body = {
      sku: f.sku.trim(), title: f.title.trim(), categoryId: f.categoryId, tagline: f.tagline.trim(), description: f.description.trim(),
      features: lines(f.features), whatYouCanBuild: lines(f.whatYouCanBuild), learningOutcomes: lines(f.learningOutcomes), boxContents: lines(f.boxContents),
      specifications: f.specifications.filter((s) => s.label.trim() && s.value.trim()), faqs: f.faqs.filter((q) => q.q.trim() && q.a.trim()), resources: f.resources.filter((r) => r.label.trim() && r.url.trim()),
      compatibility: f.compatibility.trim(), warranty: f.warranty.trim(),
      images: f.images.filter((i) => i.key.trim()).map((i, idx) => ({ key: i.key.trim(), alt: i.alt.trim(), sortOrder: idx })),
      pricePaise: price, compareAtPaise: compareAt, gstRateBp: Math.round(Number(f.gstRatePercent) * 100), hsnCode: f.hsnCode.trim(),
      lowStockThreshold: Number(f.lowStockThreshold) || 0, status: f.status, sortOrder: Number(f.sortOrder) || 0, isFeatured: f.isFeatured, isBestSeller: f.isBestSeller,
      seo: { title: f.seoTitle.trim(), description: f.seoDescription.trim() }, relatedIds: f.relatedIds,
    };
    if (f.slug.trim()) body.slug = f.slug.trim();
    if (!editing) body.stock = Number(f.stock) || 0;
    return { body };
  }

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    const { body, problems } = build();
    if (problems) return setErrors(problems);
    setErrors({});
    setBusy(true);
    try {
      const saved = editing ? await admin.patch(`/products/${id}`, body) : await admin.post("/products", body);
      toast.success(editing ? "Product saved." : "Product created.");
      if (!editing) router.replace(`/admin/products/${saved.id}`);
    } catch (e2) {
      const map = { pricePaise: "price", compareAtPaise: "compareAt", gstRateBp: "gstRatePercent" };
      const mapped = Object.fromEntries(Object.entries(e2.fields ?? {}).map(([k, v]) => [map[k] ?? k, v]));
      setErrors(mapped);
      setFormError(Object.keys(mapped).length ? "Please fix the highlighted fields." : e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function archive() {
    setBusy(true);
    try {
      await admin.del(`/products/${id}`);
      toast.success("Product archived.");
      router.replace("/admin/products");
    } catch (e2) {
      toast.error(e2.message);
      setBusy(false);
      setArchiving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <PageHeader
        title={editing ? f.title || "Edit product" : "New product"}
        description={editing ? "Changes go live on the storefront within a minute." : "Fill in what customers need to understand the product. Draft products are hidden."}
        actions={
          <>
            {editing && f.status !== "archived" && <Button variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setArchiving(true)}>Archive</Button>}
            <Button variant="secondary" href="/admin/products">Back</Button>
            <Button type="submit" loading={busy}>{editing ? "Save changes" : "Create product"}</Button>
          </>
        }
      />
      {formError && <p role="alert" className="mb-4 rounded-md bg-danger/10 p-3 text-sm font-medium text-danger">{formError}</p>}
      {cats.length === 0 && <p className="mb-4 rounded-md border border-accent/60 bg-accent/15 p-3 text-sm">You need at least one category first. <a className="font-semibold text-brand underline underline-offset-4" href="/admin/categories">Create a category</a></p>}

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Panel title="Basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" value={f.title} onChange={set("title")} error={err("title")} className="sm:col-span-2" />
              <Field label="SKU" value={f.sku} onChange={set("sku")} error={err("sku")} hint="Unique stock code, e.g. KIT-001." />
              <Field label="URL slug" optional value={f.slug} onChange={set("slug")} error={err("slug")} hint="Generated from the title if left blank." />
              <Field as="select" label="Category" value={f.categoryId} onChange={set("categoryId")} error={err("categoryId")}>
                <option value="">Choose…</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Field>
              <Field as="select" label="Status" value={f.status} onChange={set("status")} hint="Only published products are visible to customers.">
                <option value="draft">Draft (hidden)</option><option value="published">Published</option><option value="archived">Archived (hidden)</option>
              </Field>
              <Field label="Short introduction" value={f.tagline} onChange={set("tagline")} error={err("tagline")} className="sm:col-span-2" />
              <Field as="textarea" label="Description" value={f.description} onChange={set("description")} error={err("description")} className="sm:col-span-2" />
            </div>
          </Panel>

          <Panel title="Learning content">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field as="textarea" label="Features" hint="One per line." value={f.features} onChange={set("features")} />
              <Field as="textarea" label="What you can build" hint="One per line." value={f.whatYouCanBuild} onChange={set("whatYouCanBuild")} />
              <Field as="textarea" label="Learning outcomes" hint="One per line." value={f.learningOutcomes} onChange={set("learningOutcomes")} />
              <Field as="textarea" label="What's in the box" hint="One per line." value={f.boxContents} onChange={set("boxContents")} />
            </div>
          </Panel>

          <Panel title="Details">
            <div className="space-y-6">
              <PairList title="Specifications" rows={f.specifications} onChange={(v) => setF((s) => ({ ...s, specifications: v }))} a="label" b="value" aLabel="Label" bLabel="Value" />
              <Field as="textarea" label="Compatibility" optional value={f.compatibility} onChange={set("compatibility")} />
              <PairList title="Downloads and resources" hint="Link to documentation or files (https:// or a media key)." rows={f.resources} onChange={(v) => setF((s) => ({ ...s, resources: v }))} a="label" b="url" aLabel="Label" bLabel="Link" />
              <Field as="textarea" label="Warranty text" optional hint="Shown only when filled in. Describe exactly what you commit to." value={f.warranty} onChange={set("warranty")} />
              <PairList title="FAQs" rows={f.faqs} onChange={(v) => setF((s) => ({ ...s, faqs: v }))} a="q" b="a" aLabel="Question" bLabel="Answer" />
            </div>
          </Panel>

          <Panel title="Images">
            <p className="mb-3 text-sm text-muted">Enter the media key or https link of each image (first one is the main image). Direct upload to cloud storage is not connected yet.</p>
            <div className="space-y-3">
              {f.images.map((img, i) => (
                <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1.2fr_1fr_auto]">
                  <Field label={`Image ${i + 1} key or link`} value={img.key} onChange={(e) => setF((s) => ({ ...s, images: s.images.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)) }))} error={err(`images.${i}.key`)} />
                  <Field label="Alt text" value={img.alt} onChange={(e) => setF((s) => ({ ...s, images: s.images.map((x, idx) => (idx === i ? { ...x, alt: e.target.value } : x)) }))} hint="Describe the image for screen readers." />
                  <button type="button" onClick={() => setF((s) => ({ ...s, images: s.images.filter((_, idx) => idx !== i) }))} className="mt-6 grid size-10 place-items-center self-start rounded-full text-muted hover:bg-danger/10 hover:text-danger" aria-label={`Remove image ${i + 1}`}><TrashIcon className="size-4" /></button>
                </div>
              ))}
            </div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={() => setF((s) => ({ ...s, images: [...s.images, { key: "", alt: "" }] }))}><PlusIcon className="size-4" /> Add image</Button>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pricing and tax">
            <div className="space-y-4">
              <Field label="Selling price (₹)" inputMode="decimal" value={f.price} onChange={set("price")} error={err("price", "pricePaise")} />
              <Field label="Compare-at price (₹)" optional inputMode="decimal" value={f.compareAt} onChange={set("compareAt")} error={err("compareAt")} hint="Shown struck through when higher than the price." />
              <Field as="select" label="GST rate" value={f.gstRatePercent} onChange={set("gstRatePercent")} error={err("gstRatePercent")}>
                {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
              </Field>
              <Field label="HSN code" value={f.hsnCode} onChange={set("hsnCode")} error={err("hsnCode")} hint="4 to 8 digits. Check the right code with your CA." />
            </div>
          </Panel>
          <Panel title="Stock">
            <div className="space-y-4">
              {editing ? <p className="text-sm">Current stock: <strong className="tabular-nums">{f.stock}</strong>. <a href="/admin/inventory" className="font-semibold text-brand underline underline-offset-4">Adjust in Inventory</a> so every change is recorded.</p> : <Field label="Opening stock" inputMode="numeric" value={f.stock} onChange={set("stock")} error={err("stock")} />}
              <Field label="Low-stock alert at" inputMode="numeric" value={f.lowStockThreshold} onChange={set("lowStockThreshold")} error={err("lowStockThreshold")} />
              <Field label="Display order" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} hint="Lower numbers appear first." />
            </div>
          </Panel>
          <Panel title="Homepage">
            <div className="space-y-1">
              <p className="mb-2 text-xs text-muted">Choose where this product is promoted on the homepage. Only published products appear.</p>
              <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="size-4 accent-brand" checked={f.isFeatured} onChange={(e) => setF((s) => ({ ...s, isFeatured: e.target.checked }))} />
                Featured product (the large spotlight; the first featured product is used)
              </label>
              <label className="flex min-h-9 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="size-4 accent-brand" checked={f.isBestSeller} onChange={(e) => setF((s) => ({ ...s, isBestSeller: e.target.checked }))} />
                Best seller (up to 4 are shown)
              </label>
            </div>
          </Panel>
          <Panel title="Search engines">
            <div className="space-y-4">
              <Field label="SEO title" optional value={f.seoTitle} onChange={set("seoTitle")} error={err("seo.title")} hint="Up to 70 characters. Defaults to the product title." />
              <Field as="textarea" label="SEO description" optional value={f.seoDescription} onChange={set("seoDescription")} error={err("seo.description")} hint="Up to 170 characters." className="[&_textarea]:!min-h-24" />
            </div>
          </Panel>
          <Panel title="Related products">
            <p className="mb-2 text-xs text-muted">Shown under the product. Up to 10.</p>
            <div className="max-h-56 space-y-1 overflow-y-auto">
              {others.length === 0 && <p className="text-sm text-muted">No other products yet.</p>}
              {others.map((o) => (
                <label key={o.id} className="flex min-h-9 cursor-pointer items-center gap-3 text-sm">
                  <input type="checkbox" className="size-4 accent-brand" checked={f.relatedIds.includes(o.id)} onChange={(e) => setF((s) => ({ ...s, relatedIds: e.target.checked ? [...s.relatedIds, o.id].slice(0, 10) : s.relatedIds.filter((x) => x !== o.id) }))} />
                  {o.title}
                </label>
              ))}
            </div>
          </Panel>
        </div>
      </div>
      <ConfirmDialog open={archiving} title="Archive this product?" danger confirmLabel="Archive" busy={busy} onCancel={() => setArchiving(false)} onConfirm={archive} message="It disappears from the storefront immediately. Past orders keep their copy of it, and you can publish it again later." />
    </form>
  );
}
