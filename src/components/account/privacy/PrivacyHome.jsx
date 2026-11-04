"use client";

import Link from "next/link";
import { useState } from "react";
import { Modal } from "@/components/admin/ui";
import RequestForm from "@/components/account/privacy/RequestForm";
import { DemoUnavailable, ReauthNotice, StatusBadge, TYPE_LABEL, fmtDate, fmtDateTime, isReauth } from "@/components/account/privacy/shared";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { ErrorState, Skeleton } from "@/components/ui/States";
import { Badge, Card } from "@/components/ui/Layout";
import useAsync from "@/hooks/useAsync";
import { declareAge, getAccessSummary, getMyPrivacy, listMyNotices, markNoticeRead, requestParental, withdrawParental } from "@/lib/client/privacyApi";
import { formatINR } from "@/lib/money";
import { IS_DEMO } from "@/lib/env";
import { formatMobile } from "@/lib/validation";
import { useToast } from "@/providers/ToastProvider";

const RIGHTS = [
  { type: "ACCESS", title: "What data do you hold about me?", text: "A summary of my personal data, why it is used and who it is shared with." },
  { type: "CORRECTION", title: "Correct my data", text: "Fix something that is wrong or incomplete." },
  { type: "ERASURE", title: "Erase my data", text: "Erase or anonymise what we are not required to keep." },
  { type: "NOMINATION", title: "Nominate someone", text: "Name a person to exercise my rights if I die or cannot." },
  { type: "GRIEVANCE", title: "Send a grievance", text: "Tell us about a concern with how my data is handled." },
];

function SummaryDialog({ open, onClose }) {
  const [state, setState] = useState({ loading: false, data: null, error: null });
  const [loadedFor, setLoadedFor] = useState(false);
  if (open && !loadedFor) {
    setLoadedFor(true);
    setState({ loading: true, data: null, error: null });
    getAccessSummary().then((data) => setState({ loading: false, data, error: null }), (error) => setState({ loading: false, data: null, error }));
  }
  const close = () => {
    setLoadedFor(false);
    onClose();
  };
  const s = state.data;
  return (
    <Modal open={open} title="Summary of the personal data we hold" onClose={close} wide footer={<Button variant="secondary" onClick={close}>Close</Button>}>
      {state.loading && <Skeleton className="h-40" />}
      {state.error && (isReauth(state.error) ? <ReauthNotice /> : <ErrorState description={state.error.message} />)}
      {s && (
        <div className="space-y-5 text-sm">
          <section aria-labelledby="sum-profile">
            <h3 id="sum-profile" className="font-semibold">Your account</h3>
            <p className="mt-1">Mobile {formatMobile(s.profile.mobile)} · Name {s.profile.name ?? "not given"} · Email {s.profile.email ?? "not given"}</p>
            <p className="text-muted">Created {fmtDate(s.profile.createdAt)} · Last login {fmtDateTime(s.profile.lastLoginAt) || "n/a"} · Age declaration: {s.profile.ageDeclaration.replaceAll("_", " ")}</p>
          </section>
          <section aria-labelledby="sum-addr">
            <h3 id="sum-addr" className="font-semibold">Saved addresses ({s.addresses.length})</h3>
            <ul className="mt-1 list-disc pl-5">
              {s.addresses.map((a, i) => <li key={i}>{a.name}, {a.line}, {a.city}, {a.state} {a.pincode}</li>)}
              {s.addresses.length === 0 && <li className="list-none text-muted">None</li>}
            </ul>
          </section>
          <section aria-labelledby="sum-orders">
            <h3 id="sum-orders" className="font-semibold">Orders on record ({s.orders.length})</h3>
            <ul className="mt-1 list-disc pl-5">
              {s.orders.map((o) => <li key={o.orderNumber}>{o.orderNumber}, {fmtDate(o.placedAt)}, {o.status.replaceAll("_", " ")}, {formatINR(o.totalPaise)}</li>)}
              {s.orders.length === 0 && <li className="list-none text-muted">None</li>}
            </ul>
          </section>
          <section aria-labelledby="sum-use">
            <h3 id="sum-use" className="font-semibold">What we use it for</h3>
            <ul className="mt-1 list-disc pl-5">
              {s.purposes.map((p) => <li key={p.purpose}><strong>{p.purpose}</strong>: {p.description}</li>)}
              {s.activeConsents.map((c) => <li key={c.purpose}><strong>{c.purpose}</strong> (your optional consent, since {fmtDate(c.since)})</li>)}
            </ul>
            <p className="mt-1 text-muted">Messages sent to you so far: {s.messagesSent}.</p>
          </section>
          <section aria-labelledby="sum-shared">
            <h3 id="sum-shared" className="font-semibold">Who it is shared with</h3>
            <ul className="mt-1 list-disc pl-5">
              {s.sharedWith.map((p) => <li key={p.name}><strong>{p.name}</strong>: {p.service}. Data: {p.data.join(", ")}.</li>)}
            </ul>
          </section>
          <p className="rounded-md bg-subtle p-3 text-slate-700">{s.retained}</p>
        </div>
      )}
    </Modal>
  );
}

function ChildrenSection({ info, reload }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const age = info.profile.ageStatus;

  async function choose(status) {
    setBusy(true);
    try {
      await declareAge(status);
      toast.success("Saved.");
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendParental() {
    setBusy(true);
    setErrors({});
    try {
      await requestParental(form);
      toast.success("Request sent for review.");
      setForm(null);
      reload();
    } catch (e) {
      setErrors({ form: e.message, ...(e.fields ?? {}) });
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(id) {
    try {
      await withdrawParental(id);
      toast.success("Parental consent withdrawn.");
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <Card as="section" aria-labelledby="children-h" className="p-6">
      <h2 id="children-h" className="text-lg font-semibold">Children&apos;s privacy</h2>
      <p className="mt-1 text-sm text-muted">A child is anyone under 18. We do not track or profile children, and we send no marketing to them. Telling us your age group is optional; we only keep what you tell us.</p>
      <fieldset className="mt-4" disabled={busy}>
        <legend className="sr-only">Age group</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" name="age" checked={age === "adult_declared"} onChange={() => choose("adult_declared")} className="size-4 accent-brand" /> I am 18 or older</label>
          <label className="flex items-center gap-2"><input type="radio" name="age" checked={age === "minor_declared"} onChange={() => choose("minor_declared")} className="size-4 accent-brand" /> I am under 18</label>
        </div>
      </fieldset>

      {age === "minor_declared" && (
        <div className="mt-4 space-y-3 rounded-md border border-line bg-subtle p-4 text-sm">
          <p><strong>Accounts declared as under 18 cannot place orders</strong> until a parent or guardian is verified. We also switched off optional offers.</p>
          {info.childrenMode === "parental_consent" ? (
            <>
              <p>A trained member of staff verifies the parent or guardian. A tick-box is not used as proof. We do not ask for any ID number here.</p>
              {info.parental.length > 0 && (
                <ul className="space-y-2">
                  {info.parental.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface p-3">
                      <span>
                        <Badge tone={p.status === "verified" ? "success" : p.status === "pending" ? "info" : "neutral"}>{p.status}</Badge> {p.parentName}
                        {p.verifiedAt ? <span className="text-muted"> · verified {fmtDate(p.verifiedAt)}</span> : null}
                      </span>
                      {["pending", "verified"].includes(p.status) && <Button size="sm" variant="secondary" onClick={() => withdraw(p.id)}>Withdraw parental consent</Button>}
                    </li>
                  ))}
                </ul>
              )}
              {!info.parental.some((p) => ["pending", "verified"].includes(p.status)) && <Button size="sm" onClick={() => setForm({ parentName: "", parentMobile: "", learnerLabel: "" })}>Ask for a parent to be verified</Button>}
            </>
          ) : (
            <p>Please ask a parent or guardian to create an account and place the order for you.</p>
          )}
        </div>
      )}

      <Modal open={Boolean(form)} title="Parent or guardian details" onClose={() => setForm(null)} footer={<><Button variant="ghost" onClick={() => setForm(null)}>Cancel</Button><Button onClick={sendParental} loading={busy}>Send for review</Button></>}>
        {form && (
          <div className="space-y-4">
            {errors.form && <p role="alert" className="rounded-md bg-danger/10 p-3 text-sm font-medium text-danger-ink">{errors.form}</p>}
            <Field label="Parent or guardian's name" value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} error={errors.parentName} />
            <Field label="Parent or guardian's mobile number" type="tel" value={form.parentMobile} onChange={(e) => setForm({ ...form, parentMobile: e.target.value })} error={errors.parentMobile} hint="We use it only to verify them." />
            <Field label="What should we call the learner?" optional value={form.learnerLabel} onChange={(e) => setForm({ ...form, learnerLabel: e.target.value })} hint="A nickname is fine. Not a legal name." />
          </div>
        )}
      </Modal>
    </Card>
  );
}

export default function PrivacyHome() {
  const toast = useToast();
  const info = useAsync(() => (IS_DEMO ? Promise.resolve(null) : getMyPrivacy()), []);
  const notices = useAsync(() => (IS_DEMO ? Promise.resolve([]) : listMyNotices()), []);
  const [formType, setFormType] = useState(null);
  const [summary, setSummary] = useState(false);

  if (IS_DEMO) return <DemoUnavailable />;
  if (info.error) return <ErrorState description={info.error.message} onRetry={info.reload} />;
  if (!info.data) return <Skeleton className="h-64" />;
  const d = info.data;
  const unread = (notices.data ?? []).filter((n) => !n.readAt);

  async function read(n) {
    try {
      await markNoticeRead(n.id);
      notices.reload();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy and your data</h1>
        <p className="mt-1 max-w-2xl text-muted">See what we hold, manage optional choices, and exercise your rights. Questions go to our privacy contact, shown below.</p>
      </div>

      {(notices.data ?? []).length > 0 && (
        <section aria-labelledby="notices-h" className="rounded-card border border-warning/40 bg-warning/10 p-5">
          <h2 id="notices-h" className="text-lg font-semibold">Important notices about your data{unread.length ? ` (${unread.length} new)` : ""}</h2>
          <ul className="mt-3 space-y-3">
            {notices.data.map((n) => (
              <li key={n.id} className="rounded-md bg-surface p-4 text-sm">
                <p className="text-muted">Received {fmtDateTime(n.receivedAt)}{n.readAt ? "" : " · new"}</p>
                <p className="mt-1 whitespace-pre-line">{n.text}</p>
                {!n.readAt && <Button size="sm" variant="secondary" className="mt-3" onClick={() => read(n)}>Mark as read</Button>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card as="section" aria-labelledby="contact-h" className="p-6">
        <h2 id="contact-h" className="text-lg font-semibold">Our privacy contact</h2>
        {d.contact.name || d.contact.email ? (
          <p className="mt-2 text-sm">
            {[d.contact.name, d.contact.title].filter(Boolean).join(", ")}
            {d.contact.email ? <> · <a href={`mailto:${d.contact.email}`} className="font-medium text-brand underline underline-offset-4">{d.contact.email}</a></> : null}
            {d.contact.phone ? ` · ${d.contact.phone}` : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">The store has not published its privacy contact yet. You can still send requests below and they will be recorded.</p>
        )}
        <p className="mt-2 text-sm text-muted">Read the <Link href="/privacy-policy" className="font-medium text-brand underline underline-offset-4">privacy policy</Link>. Grievances are answered within {d.grievanceResponseDays} days at most.</p>
      </Card>

      <Card as="section" aria-labelledby="data-h" className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="data-h" className="text-lg font-semibold">Your personal data</h2>
          <Button size="sm" variant="secondary" onClick={() => setSummary(true)}>View full summary</Button>
        </div>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Mobile number</dt><dd className="font-medium">{formatMobile(d.profile.mobile)}</dd></div>
          <div><dt className="text-muted">Name</dt><dd className="font-medium">{d.profile.name || "Not given"}</dd></div>
          <div><dt className="text-muted">Email</dt><dd className="font-medium">{d.profile.email || "Not given"}</dd></div>
          <div><dt className="text-muted">Saved addresses · Orders</dt><dd className="font-medium">{d.counts.addresses} · {d.counts.orders}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-muted">The full summary also shows what each piece is used for and who it is shared with. It needs a fresh login code.</p>
      </Card>

      <section aria-labelledby="rights-h">
        <h2 id="rights-h" className="text-lg font-semibold">Your rights</h2>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {RIGHTS.map((r) => (
            <li key={r.type}>
              <button type="button" onClick={() => setFormType(r.type)} className="card-hover block h-full w-full rounded-card border border-line bg-surface p-5 text-left shadow-card">
                <span className="block font-semibold">{r.title}</span>
                <span className="mt-1 block text-sm text-muted">{r.text}</span>
              </button>
            </li>
          ))}
          <li>
            <Link href="/account/privacy/consents" className="card-hover block h-full rounded-card border border-line bg-surface p-5 shadow-card">
              <span className="block font-semibold">Manage optional consents</span>
              <span className="mt-1 block text-sm text-muted">Turn offers and other optional uses on or off.</span>
            </Link>
          </li>
        </ul>
      </section>

      <ChildrenSection info={d} reload={info.reload} />

      <section aria-labelledby="recent-h">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-h" className="text-lg font-semibold">Recent requests</h2>
          <Link href="/account/privacy/requests" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">See all</Link>
        </div>
        {d.recentRequests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No requests yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {d.recentRequests.map((r) => (
              <li key={r.requestId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface p-3 text-sm">
                <span><span className="font-mono font-semibold tabular-nums">{r.requestId}</span> · {TYPE_LABEL[r.type]} · {fmtDate(r.submittedAt)}</span>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {formType && <RequestForm type={formType} open onClose={() => setFormType(null)} onCreated={info.reload} />}
      <SummaryDialog open={summary} onClose={() => setSummary(false)} />
    </div>
  );
}
