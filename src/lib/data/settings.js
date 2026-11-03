import { cacheLife, cacheTag } from "next/cache";
import { API_URL, BRAND_NAME, DATA_SOURCE } from "@/lib/env";
import { placeholderSettings } from "@/content/placeholder-settings";
import { LEGAL_PAGES } from "@/lib/constants";

/** Public store settings (company contact info, commerce toggles). Never contains secrets. */
export async function getPublicSettings() {
  "use cache";
  cacheLife("minutes");
  cacheTag("settings");
  let settings = placeholderSettings;
  if (DATA_SOURCE === "api") {
    const res = await fetch(`${API_URL}/content/settings/public`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Settings API ${res.status}`);
    settings = (await res.json()).data;
  }
  return {
    ...settings,
    company: { ...settings.company, tradeName: settings.company.tradeName || BRAND_NAME },
  };
}

/** Legal page content. Returns null content when the admin has not published the page yet. */
export async function getLegalPage(slug) {
  "use cache";
  cacheLife("minutes");
  cacheTag("legal", `legal:${slug}`);
  const meta = LEGAL_PAGES.find((p) => p.slug === slug);
  if (!meta) return null;
  if (DATA_SOURCE === "api") {
    const res = await fetch(`${API_URL}/content/legal/${slug}`, { headers: { Accept: "application/json" } });
    if (res.status === 404) return { ...meta, content: "", updatedAt: null };
    if (!res.ok) throw new Error(`Legal API ${res.status}`);
    const data = (await res.json()).data;
    return { ...meta, content: data.markdown ?? "", updatedAt: data.updatedAt ?? null };
  }
  return { ...meta, content: "", updatedAt: null };
}
