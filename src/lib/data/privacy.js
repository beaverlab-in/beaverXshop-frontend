// Server-side reads for the public legal pages (privacy policy, cookie list). The published policy is authored in the admin panel
// (Privacy & Compliance > Privacy policy) and versioned by the backend; nothing is invented here.
import { cacheLife, cacheTag } from "next/cache";
import { API_URL, DATA_SOURCE } from "@/lib/env";
import { DEMO_COOKIES } from "@/content/privacy-demo";

/**
 * The published privacy policy ({ version, publishedAt, sections: [{ key, title, body }] }), or null when none is published.
 * Deliberately NOT cached: legal text must be exactly what staff last published, so every visit asks the backend.
 */
export async function getPublishedPolicy() {
  if (DATA_SOURCE !== "api") return null;
  const res = await fetch(`${API_URL}/privacy/notices/privacy-policy`, { headers: { Accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Privacy policy API ${res.status}`);
  return (await res.json()).data;
}

/** The cookie and storage list changes only with a deploy, so it is cached. */
export async function getCookieRegistry() {
  "use cache";
  cacheLife("hours");
  cacheTag("privacy");
  if (DATA_SOURCE !== "api") return DEMO_COOKIES;
  const res = await fetch(`${API_URL}/privacy/cookies`, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Cookie registry API ${res.status}`);
  return (await res.json()).data;
}
