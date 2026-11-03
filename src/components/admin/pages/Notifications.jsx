"use client";

import { PageHeader, Panel } from "@/components/admin/ui";
import { Badge } from "@/components/ui/Layout";

const TEMPLATES = [
  ["otp", "Login code (OTP)"],
  ["order_placed", "Order placed"],
  ["payment_success", "Payment successful"],
  ["order_confirmed", "Order confirmed"],
  ["order_shipped", "Order shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancellation"],
  ["refund_update", "Refund updates"],
];

/**
 * Honest placeholder: WhatsApp Business is not connected, so no message is sent and no history exists.
 * The templates/history/retry screens are built in Phase 6 together with the notification service.
 */
export default function Notifications() {
  return (
    <>
      <PageHeader title="Notifications" description="WhatsApp messages for login codes and order updates." />
      <p className="mb-6 rounded-md border border-accent/60 bg-accent/15 p-4 text-sm" role="note">
        <strong>WhatsApp is not connected yet.</strong> No customer message is being sent. Login codes currently use the development provider (printed on the server), and order updates are visible only inside the customer&apos;s account. Message history, delivery status, failed messages and retries will appear here once the integration is built and your WhatsApp Business account and approved templates are configured.
      </p>
      <Panel title="Planned message templates" padded={false}>
        <ul className="divide-y divide-line">
          {TEMPLATES.map(([key, label]) => (
            <li key={key} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div><p className="font-medium">{label}</p><p className="font-mono text-xs text-muted">{key}</p></div>
              <Badge tone="warning">Not configured</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
