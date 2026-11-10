"use client";

import { useState } from "react";
import CollectionNotice from "@/components/account/privacy/CollectionNotice";
import { DemoUnavailable, fmtDateTime } from "@/components/account/privacy/shared";
import Button from "@/components/ui/Button";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { Badge, Card } from "@/components/ui/Layout";
import useAsync from "@/hooks/useAsync";
import { getMyConsents, grantConsent, withdrawConsent } from "@/lib/client/privacyApi";
import { IS_DEMO } from "@/lib/env";
import { useToast } from "@/providers/ToastProvider";

/** Optional consents only. Giving one is a deliberate tap on "Turn on"; withdrawing is one tap on "Turn off", with no questions. */
export default function ConsentsView() {
  const toast = useToast();
  const { data, error, reload } = useAsync(() => (IS_DEMO ? Promise.resolve(null) : getMyConsents()), []);
  const [busyKey, setBusyKey] = useState("");
  const [problem, setProblem] = useState("");
  if (IS_DEMO) return <DemoUnavailable />;
  if (error) return <ErrorState description={error.message} onRetry={reload} />;
  if (!data) return <Skeleton className="h-64" />;

  async function toggle(p) {
    setBusyKey(p.key);
    setProblem("");
    try {
      if (p.status === "granted") {
        await withdrawConsent(p.key);
        toast.success("Turned off. We have stopped this use.");
      } else {
        await grantConsent(p.key, data.noticeVersion, "account");
        toast.success("Turned on.");
      }
      reload();
    } catch (e) {
      if (e.code === "CONFLICT") reload(); // the notice was updated: show the new text before agreeing
      setProblem(e.message);
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Your consents</h1>
      <p className="mt-1 max-w-2xl text-muted">
        These are optional. Everything you need to order and receive your products works without them. Order messages (confirmation, payment, shipping, delivery, refunds) are not marketing and are not listed here.
      </p>
      {problem && <p role="alert" className="mt-4 rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">{problem}</p>}

      <ul className="mt-6 space-y-4" aria-label="Optional consents">
        {data.purposes.map((p) => (
          <Card as="li" key={p.key} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0 max-w-xl">
              <p className="font-semibold">{p.label}</p>
              <p className="mt-0.5 text-sm text-muted">{p.description}</p>
              <p className="mt-2 text-sm">
                <Badge tone={p.status === "granted" ? "success" : "neutral"}>{p.status === "granted" ? "On" : "Off"}</Badge>
                {p.status === "granted" && <span className="ml-2 text-muted">since {fmtDateTime(p.grantedAt)}</span>}
              </p>
            </div>
            <Button variant={p.status === "granted" ? "secondary" : "primary"} onClick={() => toggle(p)} loading={busyKey === p.key} aria-label={`${p.status === "granted" ? "Turn off" : "Turn on"}: ${p.label}`}>
              {p.status === "granted" ? "Turn off" : "Turn on"}
            </Button>
          </Card>
        ))}
      </ul>

      <CollectionNotice context="marketing" className="mt-6" />

      <section className="mt-8" aria-labelledby="consent-history">
        <h2 id="consent-history" className="text-lg font-semibold">History</h2>
        {data.history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">You have not given or withdrawn any consent yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-md border border-line">
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
              <caption className="sr-only">Consent history</caption>
              <thead className="bg-subtle">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">When</th>
                  <th scope="col" className="px-3 py-2 font-semibold">What</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Event</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Notice version</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((h, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-3 py-2 tabular-nums">{fmtDateTime(h.at)}</td>
                    <td className="px-3 py-2">{data.purposes.find((p) => p.key === h.purposeKey)?.label ?? h.purposeKey}</td>
                    <td className="px-3 py-2">{h.event === "granted" ? "Turned on" : "Turned off"}</td>
                    <td className="px-3 py-2 tabular-nums">{h.noticeVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
