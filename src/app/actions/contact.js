"use server";

import { API_URL, DATA_SOURCE } from "@/lib/env";
import { isValidEmail, normalizeMobile } from "@/lib/validation";

/** Server Action for the contact form. In sample mode nothing is sent and the UI says so. */
export async function submitContactAction(_prev, formData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const mobile = String(formData.get("mobile") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  const errors = {};
  if (name.length < 2) errors.name = "Please tell us your name.";
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (mobile && !normalizeMobile(mobile)) errors.mobile = "Enter a valid 10-digit mobile number or leave it blank.";
  if (message.length < 10) errors.message = "Please write at least a short sentence (10 characters).";
  if (Object.keys(errors).length) return { ok: false, errors, values: { name, email, mobile, message } };

  if (honeypot) return { ok: true, demo: false }; // bots: pretend success, send nothing

  if (DATA_SOURCE !== "api") {
    return { ok: true, demo: true };
  }
  try {
    const res = await fetch(`${API_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, mobile: normalizeMobile(mobile) || undefined, message }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Contact API ${res.status}`);
    return { ok: true, demo: false };
  } catch (error) {
    console.error("[contact] failed:", error?.message);
    return {
      ok: false,
      errors: { form: "We couldn't send your message right now. Please try again in a moment." },
      values: { name, email, mobile, message },
    };
  }
}
