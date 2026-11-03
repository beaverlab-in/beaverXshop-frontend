"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Layout";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { MapPinIcon } from "@/components/ui/Icons";
import AddressForm from "@/components/account/AddressForm";
import { AddressBadges, AddressText } from "@/components/account/AddressBits";
import useAsync from "@/hooks/useAsync";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { deleteAddress, listAddresses, setDefaultAddress } from "@/lib/client/accountApi";
import { formatMobile } from "@/lib/validation";

export default function AddressesView() {
  const { user } = useAuth();
  const toast = useToast();
  const { data, error, loading, reload } = useAsync(listAddresses, []);
  const [editing, setEditing] = useState(null); // null | "new" | address
  const [confirmId, setConfirmId] = useState(null);

  async function run(fn, successMessage) {
    try {
      await fn();
      toast.success(successMessage);
      await reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading && !data) return <Skeleton className="h-48" />;
  if (error) return <ErrorState description={error.message} onRetry={reload} />;

  const addresses = data ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Saved addresses</h1>
        {!editing && addresses.length > 0 && <Button onClick={() => setEditing("new")}>Add new address</Button>}
      </div>
      <p className="mt-2 text-muted">Orders keep their own copy of the delivery address. Editing a saved address never changes an existing order.</p>

      {editing ? (
        <Card className="mt-6 p-6 sm:p-8">
          <h2 className="mb-5 text-xl font-bold">{editing === "new" ? "New address" : "Edit address"}</h2>
          <AddressForm
            initial={editing === "new" ? undefined : { ...editing, mobile: editing.mobile }}
            defaultName={user?.name}
            defaultMobile={user?.mobile}
            onSaved={() => {
              toast.success("Address saved.");
              setEditing(null);
              reload();
            }}
            onCancel={() => setEditing(null)}
          />
        </Card>
      ) : addresses.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<MapPinIcon className="size-7" />}
            title="No saved addresses yet"
            description="Add an address to speed up checkout."
            action={{ onClick: () => setEditing("new"), label: "Add an address" }}
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="flex h-full flex-col p-5">
                <AddressBadges address={a} />
                <div className="mt-3 flex-1">
                  <AddressText address={{ ...a, mobile: a.mobile }} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(a)}>
                    Edit
                  </Button>
                  {!a.isDefault && (
                    <Button size="sm" variant="ghost" onClick={() => run(() => setDefaultAddress(a.id), "Default address updated.")}>
                      Set as default
                    </Button>
                  )}
                  {confirmId === a.id ? (
                    <span className="flex items-center gap-2">
                      <Button size="sm" variant="danger" onClick={() => { setConfirmId(null); run(() => deleteAddress(a.id), "Address deleted."); }}>
                        Confirm delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmId(null)}>
                        Keep
                      </Button>
                    </span>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/10" onClick={() => setConfirmId(a.id)} aria-label={`Delete address for ${a.fullName} (${formatMobile(a.mobile)})`}>
                      Delete
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
