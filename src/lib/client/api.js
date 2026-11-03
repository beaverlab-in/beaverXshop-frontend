// Browser -> backend fetch wrapper (used only when NEXT_PUBLIC_DATA_SOURCE=api).
// Cookies carry the session; state-changing requests also send the CSRF token.
import { API_URL } from "@/lib/env";

export class ApiError extends Error {
  constructor(message, { status = 0, code = "UNKNOWN", fields } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let csrfToken = null;

async function ensureCsrf() {
  if (csrfToken) return csrfToken;
  const res = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
  const json = await res.json();
  csrfToken = json?.data?.token ?? null;
  return csrfToken;
}

export async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = { Accept: "application/json" };
  if (method !== "GET") {
    headers["Content-Type"] = "application/json";
    headers["X-CSRF-Token"] = (await ensureCsrf()) ?? "";
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Network problem. Check your connection and try again.", { code: "NETWORK" });
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 403) csrfToken = null; // token may have rotated; refetch next time
    throw new ApiError(json?.error?.message || "Something went wrong. Please try again.", {
      status: res.status,
      code: json?.error?.code,
      fields: json?.error?.fields,
    });
  }
  return json?.data;
}
