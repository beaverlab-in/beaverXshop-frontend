export const NAV_LINKS = [
  { href: "/products", label: "Products" },
  // No standalone learning page yet: points at the "Learning through hardware" section on the homepage, so there is no dead link.
  { href: "/#learning", label: "Learning Resources" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** The privacy policy, terms and cookie policy have their own top-level pages; every other legal page lives under /legal/. */
const TOP_LEVEL_LEGAL = new Set(["privacy-policy", "terms-and-conditions", "cookie-policy"]);
export const legalHref = (slug) => (TOP_LEVEL_LEGAL.has(slug) ? `/${slug}` : `/legal/${slug}`);

export const LEGAL_PAGES = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "terms-and-conditions", title: "Terms and Conditions" },
  { slug: "shipping-and-delivery-policy", title: "Shipping and Delivery Policy" },
  { slug: "return-and-refund-policy", title: "Return and Refund Policy" },
  { slug: "cancellation-policy", title: "Cancellation Policy" },
  { slug: "cookie-policy", title: "Cookie Policy" },
  { slug: "warranty-policy", title: "Warranty Policy" },
  { slug: "disclaimer", title: "Disclaimer" },
];

// Order status and payment status are separate concepts (see backend docs §4.3).
export const ORDER_STATUS = {
  pending_payment: { label: "Pending payment", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "info" },
  processing: { label: "Processing", tone: "info" },
  packed: { label: "Packed", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
  return_requested: { label: "Return requested", tone: "warning" },
  returned: { label: "Returned", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const PAYMENT_STATUS = {
  pending: { label: "Payment pending", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  cod_pending: { label: "Pay on delivery", tone: "info" },
  failed: { label: "Payment failed", tone: "danger" },
  partially_refunded: { label: "Partially refunded", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

// Order of the happy path, used to draw the tracking progress bar.
export const ORDER_PROGRESS = ["confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered"];

export const MAX_QTY_PER_LINE = 10;
