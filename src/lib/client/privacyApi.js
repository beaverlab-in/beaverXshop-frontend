// Browser -> backend calls for the privacy area. API mode only: in demo mode there is no backend to hold consents or requests,
// so callers use the small demo fallbacks in src/content/privacy-demo.js (and the screens say so).
import { apiFetch } from "@/lib/client/api";
import { DEMO_COLLECTION_NOTICE, DEMO_PUBLIC_CONFIG } from "@/content/privacy-demo";
import { IS_DEMO } from "@/lib/env";

export const getPublicConfig = () => (IS_DEMO ? Promise.resolve(DEMO_PUBLIC_CONFIG) : apiFetch("/privacy/public-config"));
export const getCollectionNotice = () => (IS_DEMO ? Promise.resolve(DEMO_COLLECTION_NOTICE) : apiFetch("/privacy/notices/collection"));
export const saveCookiePreference = (body) => apiFetch("/privacy/cookie-preferences", { method: "PUT", body });

export const getMyPrivacy = () => apiFetch("/me/privacy");
export const getMyConsents = () => apiFetch("/me/privacy/consents");
export const grantConsent = (purpose, noticeVersion, source = "account") => apiFetch(`/me/privacy/consents/${purpose}`, { method: "POST", body: { accepted: true, noticeVersion, source } });
export const withdrawConsent = (purpose) => apiFetch(`/me/privacy/consents/${purpose}`, { method: "DELETE" });

export const listMyRequests = (params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return apiFetch(`/me/privacy/requests${qs ? `?${qs}` : ""}`, { full: true });
};
export const createPrivacyRequest = (body) => apiFetch("/me/privacy/requests", { method: "POST", body });
export const getAccessSummary = () => apiFetch("/me/privacy/access-summary");

export const listMyNotices = () => apiFetch("/me/privacy/notices");
export const markNoticeRead = (id) => apiFetch(`/me/privacy/notices/${id}/read`, { method: "POST", body: {} });

export const declareAge = (status) => apiFetch("/me/privacy/age", { method: "PATCH", body: { status } });
export const listParental = () => apiFetch("/me/privacy/children");
export const requestParental = (body) => apiFetch("/me/privacy/children", { method: "POST", body });
export const withdrawParental = (id) => apiFetch(`/me/privacy/children/${id}`, { method: "DELETE" });

export const submitContact = (body) => apiFetch("/contact", { method: "POST", body });
