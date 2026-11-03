import { Badge } from "@/components/ui/Layout";
import { formatMobile } from "@/lib/validation";

const TYPE_LABEL = { home: "Home", work: "Work", other: "Other" };

/** Read-only address block. Also used for the immutable address snapshot on orders. */
export function AddressText({ address }) {
  return (
    <address className="text-[0.95rem] leading-relaxed not-italic">
      <strong className="font-semibold">{address.fullName}</strong>
      <br />
      {address.house}, {address.street}
      {address.landmark ? `, near ${address.landmark}` : ""}
      <br />
      {address.city}, {address.state} {address.pincode}
      <br />
      <span className="text-muted">Mobile: {formatMobile(address.mobile)}</span>
    </address>
  );
}

export function AddressBadges({ address }) {
  return (
    <div className="flex gap-2">
      <Badge tone="info">{TYPE_LABEL[address.type] ?? "Home"}</Badge>
      {address.isDefault && <Badge tone="success">Default</Badge>}
    </div>
  );
}
