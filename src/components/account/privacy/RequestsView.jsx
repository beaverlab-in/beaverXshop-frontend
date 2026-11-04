"use client";

import { useState } from "react";
import { DemoUnavailable, StatusBadge, TYPE_LABEL, fmtDate, fmtDateTime } from "@/components/account/privacy/shared";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { Card } from "@/components/ui/Layout";
import useAsync from "@/hooks/useAsync";
import { listMyRequests } from "@/lib/client/privacyApi";
import { IS_DEMO } from "@/lib/env";

/** A request's full story: what was asked, each response from the store, the resolution and the dates. */
export function RequestCard({ r }) {
  const [open, setOpen] = useState(false);
  const detailId = `req-${r.requestId}`;
  return (
    <Card as="li" className="p-5" data-request-id={r.requestId}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-semibold tabular-nums">{r.requestId}</p>
          <p className="mt-0.5 font-medium">{TYPE_LABEL[r.type] ?? r.type}</p>
          {r.subject && r.subject !== r.typeLabel && <p className="text-sm text-muted">{r.subject}</p>}
        </div>
        <StatusBadge status={r.status} />
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-muted">Submitted</dt>
          <dd>{fmtDate(r.submittedAt)}</dd>
        </div>
        {r.dueAt && !r.completedAt && (
          <div>
            <dt className="text-muted">We will respond by</dt>
            <dd>{fmtDate(r.dueAt)}</dd>
          </div>
        )}
        {r.completedAt && (
          <div>
            <dt className="text-muted">Completed</dt>
            <dd>{fmtDate(r.completedAt)}</dd>
          </div>
        )}
      </dl>
      {(r.responses.length > 0 || r.resolution || r.details) && (
        <>
          <button type="button" className="mt-3 text-sm font-semibold text-brand underline underline-offset-4" aria-expanded={open} aria-controls={detailId} onClick={() => setOpen((o) => !o)}>
            {open ? "Hide details" : "Show details and response"}
          </button>
          {open && (
            <div id={detailId} className="mt-3 space-y-3 border-t border-line pt-3 text-sm">
              {r.details && (
                <div>
                  <p className="font-medium">What you wrote</p>
                  <p className="mt-0.5 whitespace-pre-line text-slate-700">{r.details}</p>
                </div>
              )}
              {r.responses.map((x, i) => (
                <div key={i}>
                  <p className="font-medium">Response · {fmtDateTime(x.at)}</p>
                  <p className="mt-0.5 whitespace-pre-line text-slate-700">{x.text}</p>
                </div>
              ))}
              {r.resolution && (
                <div className="rounded-md bg-subtle p-3">
                  <p className="font-medium">Outcome: {r.resolution.outcome.replaceAll("_", " ")}</p>
                  <p className="mt-0.5 whitespace-pre-line text-slate-700">{r.resolution.text}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

export default function RequestsView() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useAsync(() => (IS_DEMO ? Promise.resolve(null) : listMyRequests({ page })), [page]);
  if (IS_DEMO) return <DemoUnavailable />;
  if (error) return <ErrorState description={error.message} onRetry={reload} />;
  if (loading && !data) return <Skeleton className="h-48" />;
  const { data: items, meta } = data;
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">My privacy requests</h1>
      <p className="mt-1 text-muted">Everything you have asked us, with its number, status, our response and dates.</p>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No requests yet" description="When you ask for your data, a correction, erasure, or send a grievance, it appears here so you can follow it." />
        </div>
      ) : (
        <ul className="mt-6 space-y-4" aria-label="Privacy requests">
          {items.map((r) => (
            <RequestCard key={r.requestId} r={r} />
          ))}
        </ul>
      )}
      {meta?.pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-muted">Page {meta.page} of {meta.pages}</span>
          <Button variant="secondary" size="sm" disabled={page >= meta.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
