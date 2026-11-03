"use client";

import { useState } from "react";
import { ConfirmDialog, DataTable, ErrorBanner, Modal, PageHeader, Panel } from "@/components/admin/ui";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { Badge } from "@/components/ui/Layout";
import useAdminList from "@/hooks/useAdminList";
import { admin } from "@/lib/client/adminApi";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";

const blank = { name: "", slug: "", tagline: "", image: "", sortOrder: "0", status: "active" };

export default function Categories() {
  const toast = useToast();
  const { user } = useAuth();
  const canWrite = user.permissions.includes("categories:write");
  const { data, loading, error, reload } = useAdminList("/categories");
  const [editing, setEditing] = useState(null); // null | {id?, ...form}
  const [deleting, setDeleting] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setErrors({});
    const body = { name: editing.name.trim(), tagline: editing.tagline.trim(), image: editing.image.trim(), sortOrder: Number(editing.sortOrder) || 0, status: editing.status };
    if (editing.slug.trim()) body.slug = editing.slug.trim();
    try {
      if (editing.id) await admin.patch(`/categories/${editing.id}`, body);
      else await admin.post("/categories", body);
      toast.success("Category saved.");
      setEditing(null);
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
      await admin.del(`/categories/${deleting.id}`);
      toast.success("Category deleted.");
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(e.message);
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }

  const f = editing ?? blank;
  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  return (
    <>
      <PageHeader title="Categories" description="Customers see only categories that contain published products. Hide a category to take it and its products offline." actions={canWrite && <Button onClick={() => { setErrors({}); setEditing({ ...blank }); }}>New category</Button>} />
      <ErrorBanner error={error} onRetry={reload} />
      <Panel padded={false}>
        <DataTable
          caption="Categories"
          rows={data}
          loading={loading}
          empty="No categories yet. Create one to start adding products."
          columns={[
            { key: "name", header: "Category", render: (c) => <><span className="font-semibold">{c.name}</span><br /><span className="text-xs text-muted">/{c.slug}</span></> },
            { key: "tagline", header: "Tagline" },
            { key: "productCount", header: "Products", align: "right" },
            { key: "status", header: "Status", render: (c) => <Badge tone={c.status === "active" ? "success" : "neutral"}>{c.status === "active" ? "Visible" : "Hidden"}</Badge> },
            { key: "actions", header: "", align: "right", render: (c) => canWrite && (
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="secondary" onClick={() => { setErrors({}); setEditing({ id: c.id, name: c.name, slug: c.slug, tagline: c.tagline, image: c.image, sortOrder: String(c.sortOrder), status: c.status }); }}>Edit</Button>
                <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setDeleting(c)}>Delete</Button>
              </div>
            ) },
          ]}
        />
      </Panel>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? "Edit category" : "New category"}
        footer={<><Button variant="ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button><Button loading={busy} onClick={save}>Save</Button></>}>
        <div className="space-y-4">
          <Field label="Name" value={f.name} onChange={set("name")} error={errors.name} />
          <Field label="URL slug" optional value={f.slug} onChange={set("slug")} error={errors.slug} hint="Generated from the name if left blank." />
          <Field label="Tagline" optional value={f.tagline} onChange={set("tagline")} error={errors.tagline} />
          <Field label="Image key or link" optional value={f.image} onChange={set("image")} error={errors.image} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display order" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} error={errors.sortOrder} />
            <Field as="select" label="Visibility" value={f.status} onChange={set("status")}><option value="active">Visible</option><option value="hidden">Hidden</option></Field>
          </div>
          {errors.form && <p role="alert" className="text-sm font-medium text-danger">{errors.form}</p>}
        </div>
      </Modal>
      <ConfirmDialog open={Boolean(deleting)} danger title="Delete category?" confirmLabel="Delete" busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} message={`“${deleting?.name}” will be removed. A category that still has products can't be deleted: hide it instead.`} />
    </>
  );
}
