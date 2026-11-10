// Admin panel API helpers. The admin area always talks to the real backend (it has no demo mode).
import { apiBlob, apiFetch } from "@/lib/client/api";

/** { a: 1, b: "", c: undefined } -> "?a=1" (empty values are dropped). */
export function qs(params = {}) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export const admin = {
  list: (path, params) => apiFetch(`/admin${path}${qs(params)}`, { full: true }),
  get: (path, params) => apiFetch(`/admin${path}${qs(params)}`),
  post: (path, body = {}) => apiFetch(`/admin${path}`, { method: "POST", body }),
  put: (path, body = {}) => apiFetch(`/admin${path}`, { method: "PUT", body }),
  patch: (path, body = {}) => apiFetch(`/admin${path}`, { method: "PATCH", body }),
  del: (path) => apiFetch(`/admin${path}`, { method: "DELETE" }),
};

/** Fetches a protected file and hands it to the browser: saves it, or opens it in a tab (PDF). */
export async function downloadAdminFile(path, filename, { open = false } = {}) {
  const blob = await apiBlob(`/admin${path}`);
  const url = URL.createObjectURL(blob);
  if (open) {
    window.open(url, "_blank", "noopener");
  } else {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
