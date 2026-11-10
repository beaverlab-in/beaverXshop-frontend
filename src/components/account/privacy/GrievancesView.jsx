"use client";

import { useState } from "react";
import RequestForm from "@/components/account/privacy/RequestForm";
import { RequestCard } from "@/components/account/privacy/RequestsView";
import { DemoUnavailable } from "@/components/account/privacy/shared";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import useAsync from "@/hooks/useAsync";
import { getMyPrivacy, listMyRequests } from "@/lib/client/privacyApi";
import { IS_DEMO } from "@/lib/env";

export default function GrievancesView() {
  const [open, setOpen] = useState(false);
  const info = useAsync(() => (IS_DEMO ? Promise.resolve(null) : getMyPrivacy()), []);
  const list = useAsync(() => (IS_DEMO ? Promise.resolve(null) : listMyRequests({ type: "GRIEVANCE" })), []);
  if (IS_DEMO) return <DemoUnavailable />;
  if (list.error || info.error) return <ErrorState description={(list.error || info.error).message} onRetry={() => (list.reload(), info.reload())} />;
  if (!list.data || !info.data) return <Skeleton className="h-48" />;
  const { contact, grievanceResponseDays, boardComplaintUrl } = info.data;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Grievances</h1>
      <p className="mt-1 max-w-2xl text-muted">
        If you have a concern about how your personal data is handled, tell us. We respond within a reasonable period and in any case within <strong>{grievanceResponseDays} days</strong>.
      </p>
      <div className="mt-4">
        <Button onClick={() => setOpen(true)}>Send a grievance</Button>
      </div>

      <section aria-labelledby="grievance-info" className="mt-6 rounded-card border border-line bg-subtle p-5 text-sm">
        <h2 id="grievance-info" className="font-semibold">Who to ask, and if you are not satisfied</h2>
        <p className="mt-2 text-slate-700">
          {contact.name || contact.email ? (
            <>
              Privacy contact: {[contact.name, contact.title].filter(Boolean).join(", ")}
              {contact.email ? <> · <a href={`mailto:${contact.email}`} className="font-medium text-brand underline underline-offset-4">{contact.email}</a></> : null}
              {contact.phone ? ` · ${contact.phone}` : ""}
            </>
          ) : (
            "The store has not published its privacy contact yet. You can still send a grievance here and it will be recorded."
          )}
        </p>
        <p className="mt-2 text-slate-700">
          If our answer does not resolve your concern, you can complain to the Data Protection Board of India.{" "}
          {boardComplaintUrl ? <a href={boardComplaintUrl} rel="noopener noreferrer" className="font-medium text-brand underline underline-offset-4">How to complain to the Board</a> : "Check the Board's official website for how to file a complaint."}
        </p>
      </section>

      {list.data.data.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No grievances sent" description="Grievances you send appear here with their status and our response." />
        </div>
      ) : (
        <ul className="mt-6 space-y-4" aria-label="Your grievances">
          {list.data.data.map((r) => (
            <RequestCard key={r.requestId} r={r} />
          ))}
        </ul>
      )}
      <RequestForm type="GRIEVANCE" open={open} onClose={() => setOpen(false)} onCreated={list.reload} />
    </div>
  );
}
