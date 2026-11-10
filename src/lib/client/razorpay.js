// Razorpay Checkout launcher (browser). Only the PUBLIC key id is used here; the secret never leaves the backend.
// The result of openRazorpay() is NOT proof of payment: it must be sent to the backend (/payments/verify),
// and the backend webhook remains the source of truth.
import { apiFetch } from "@/lib/client/api";

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Payment window unavailable.")));
    script.onerror = () => reject(new Error("Could not load the payment window. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

/** Resolves with Razorpay's response on success; rejects with { code: "CANCELLED" | "FAILED", message }. */
export async function openRazorpay({ keyId, orderId, amountPaise, brandName, prefill }) {
  const Razorpay = await loadScript();
  return new Promise((resolve, reject) => {
    const instance = new Razorpay({
      key: keyId,
      order_id: orderId,
      amount: amountPaise,
      currency: "INR",
      name: brandName,
      prefill,
      theme: { color: "#2563EB" },
      handler: (response) => resolve(response),
      modal: { ondismiss: () => reject({ code: "CANCELLED", message: "Payment was cancelled." }) },
    });
    instance.on("payment.failed", (event) =>
      reject({ code: "FAILED", message: event?.error?.description || "The payment could not be completed." }),
    );
    instance.open();
  });
}

export function verifyPayment(response) {
  return apiFetch("/payments/verify", { method: "POST", body: response });
}
