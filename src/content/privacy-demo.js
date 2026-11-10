// DEMO-MODE copies of what the backend serves (NEXT_PUBLIC_DATA_SOURCE=placeholder only). In API mode everything here comes
// from the backend, which builds the notice from its data inventory. Keep the wording in step with
// beaverXshop-backend/src/services/privacy/notices.js. Nothing here is legal advice or an assertion of compliance.

export const DEMO_PUBLIC_CONFIG = {
  noticeVersion: 1,
  optionalTracking: false,
  languages: ["en"],
  contact: { name: "", title: "", email: "", phone: "" },
  grievanceResponseDays: 90,
  boardComplaintUrl: "",
  childrenMode: "adult_only",
};

export const DEMO_COLLECTION_NOTICE = {
  version: 1,
  language: "en",
  languages: ["en"],
  title: "What we collect and why",
  intro: "This notice is separate from our privacy policy. It tells you exactly what personal data we ask for here and what we use it for.",
  contexts: {
    login: {
      title: "When you log in or sign up",
      items: [
        { data: "Mobile number", purpose: "Create your account and send a one-time login code", service: "Signing in and keeping your account" },
        { data: "Your name (asked once)", purpose: "Address you and put your name on orders", service: "Your account and orders" },
        { data: "Login time and the notice version you saw", purpose: "Security and proof of what you were told", service: "Account security" },
      ],
    },
    checkout: {
      title: "When you place an order",
      items: [
        { data: "Name, mobile number and email (optional)", purpose: "Process the order and contact you about it", service: "Order processing" },
        { data: "Delivery address and PIN code", purpose: "Deliver your order; calculate delivery and tax", service: "Delivery by our courier" },
        { data: "Payment status and payment reference (never your card or bank details)", purpose: "Take payment and handle refunds", service: "Online payment through Razorpay" },
        { data: "Order details", purpose: "Fulfil the order and issue your GST invoice", service: "Order, invoice and support records we must keep under tax and accounting laws" },
      ],
    },
    address: {
      title: "When you save an address",
      items: [{ data: "Name, mobile number, house and street, landmark, city, state and PIN code", purpose: "Deliver your orders and let you reuse the address", service: "Faster checkout and delivery" }],
    },
    contact: {
      title: "When you contact us",
      items: [{ data: "Name, email, mobile number (optional) and your message", purpose: "Reply to your question", service: "Customer support" }],
    },
    marketing: {
      title: "Optional offers and product news",
      items: [{ data: "Your mobile number or email", purpose: "Send offers, discounts and product news on the channel you choose", service: "Optional marketing (you can say no and still use everything else)" }],
    },
    children: {
      title: "If you are under 18",
      items: [{ data: "Whether you are an adult or under 18 (only what you tell us)", purpose: "Protect children's data: under-18 accounts cannot order, and get no marketing, until a parent is verified", service: "Child safety" }],
    },
  },
  rights: {
    title: "Your choices and rights",
    withdraw: "You can withdraw an optional consent at any time in Account > Privacy > Consents. It is as quick as giving it, and we stop that use from then on.",
    rights: "You can ask what personal data we hold, ask us to correct or erase it, nominate someone to act for you, and send a grievance, in Account > Privacy.",
    complain: "If our answer does not resolve your concern, you can complain to the Data Protection Board of India.",
    retention: "Some records, such as invoices, must be kept because other laws require it; we restrict who can see them.",
  },
  contact: { name: "", title: "", email: "", phone: "" },
  grievanceResponseDays: 90,
  boardComplaintUrl: "",
  links: { privacy: "/account/privacy", requests: "/account/privacy/requests", consents: "/account/privacy/consents", policy: "/privacy-policy" },
};

// What the website sets in the browser. Mirrors COOKIE_REGISTRY in the backend.
export const DEMO_COOKIES = [
  { name: "bls_sid (or __Host-bls_sid)", type: "cookie", category: "essential", provider: "BeaverLab (first party)", purpose: "Keeps you signed in. HttpOnly, 7 days.", duration: "7 days" },
  { name: "bls_csrf", type: "cookie", category: "essential", provider: "BeaverLab (first party)", purpose: "Protects forms from cross-site forgery. HttpOnly.", duration: "Session" },
  { name: "bls_cart_v1, bls_coupon", type: "local storage", category: "essential", provider: "BeaverLab (first party)", purpose: "Remembers your shopping cart and coupon on this device.", duration: "Until you clear it" },
  { name: "bl_cookie_prefs", type: "local storage", category: "essential", provider: "BeaverLab (first party)", purpose: "Remembers the cookie choices you make here.", duration: "Until you clear it (re-asked after 12 months)" },
  { name: "Razorpay Checkout (checkout.razorpay.com)", type: "third-party script", category: "essential", provider: "Razorpay", purpose: "Loads only when you choose to pay online, to take the payment. Razorpay may set its own cookies; see its policy.", duration: "Set by Razorpay" },
  { name: "Analytics", type: "none installed", category: "analytics", provider: "None", purpose: "Would measure site usage. Loads only after you opt in.", duration: "n/a" },
  { name: "Advertising / marketing trackers", type: "none installed", category: "marketing", provider: "None", purpose: "None are used. BeaverLab does not show targeted advertising.", duration: "n/a" },
];

export const DEMO_PURPOSES = {
  marketing_whatsapp: { key: "marketing_whatsapp", label: "Offers and product news on WhatsApp", description: "Optional marketing messages about offers, discounts and new products." },
  marketing_email: { key: "marketing_email", label: "Offers and product news by email", description: "Optional marketing emails about offers, discounts and new products." },
};
