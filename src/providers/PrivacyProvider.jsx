"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getPublicConfig, saveCookiePreference } from "@/lib/client/privacyApi";
import { DEMO_PUBLIC_CONFIG } from "@/content/privacy-demo";
import { IS_DEMO } from "@/lib/env";

const KEY = "bl_cookie_prefs";
const MAX_AGE_MS = 365 * 24 * 3600 * 1000; // choices are asked again after 12 months

const Ctx = createContext(null);

// The stored choice is read through useSyncExternalStore so it is consistent between tabs and has no hydration mismatch:
// on the server (and the first client render) the snapshot is `undefined`, meaning "not read yet".
const listeners = new Set();
const subscribe = (cb) => {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};
const readRaw = () => {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
};
const writeRaw = (value) => {
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    /* private mode: the choice then lasts for this page view only */
  }
  listeners.forEach((l) => l());
};
const serverSnapshot = () => undefined;

const newPrefId = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

function parse(raw) {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    return p?.decidedAt && Date.now() - new Date(p.decidedAt).getTime() < MAX_AGE_MS ? p : null;
  } catch {
    return null;
  }
}

/**
 * Cookie and tracking choices. Essential cookies never depend on this. Optional categories (analytics, marketing) are OFF until the
 * person opts in, and anything that would set them must sit inside <ConsentGate> so it does not load before that.
 * The banner appears only when the store has switched on "optional tracking" (an analytics or marketing tool is really installed);
 * the footer's "Cookie settings" link always opens the preference centre.
 */
export function PrivacyProvider({ children }) {
  const [config, setConfig] = useState(IS_DEMO ? DEMO_PUBLIC_CONFIG : null);
  const [open, setOpen] = useState(false);
  const raw = useSyncExternalStore(subscribe, readRaw, serverSnapshot);
  const ready = raw !== undefined;
  const prefs = useMemo(() => parse(raw), [raw]);

  useEffect(() => {
    if (!IS_DEMO) getPublicConfig().then(setConfig).catch(() => setConfig(DEMO_PUBLIC_CONFIG));
  }, []);

  const save = useCallback(
    (analytics, marketing) => {
      const next = { v: 1, analytics, marketing, decidedAt: new Date().toISOString(), prefId: prefs?.prefId ?? newPrefId(), noticeVersion: config?.noticeVersion ?? 1 };
      writeRaw(JSON.stringify(next));
      setOpen(false);
      if (!IS_DEMO) saveCookiePreference({ prefId: next.prefId, analytics, marketing, noticeVersion: next.noticeVersion }).catch(() => {}); // the local choice stands even if the record cannot be saved
    },
    [prefs, config],
  );

  const value = useMemo(
    () => ({
      config,
      ready,
      decided: Boolean(prefs),
      analytics: Boolean(prefs?.analytics),
      marketing: Boolean(prefs?.marketing),
      dialogOpen: open,
      openCookieSettings: () => setOpen(true),
      closeCookieSettings: () => setOpen(false),
      acceptOptional: () => save(true, true),
      rejectOptional: () => save(false, false),
      savePreferences: save,
      showBanner: Boolean(config?.optionalTracking) && ready && !prefs,
    }),
    [config, ready, prefs, open, save],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrivacy() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrivacy must be used inside <PrivacyProvider>");
  return ctx;
}

/** Renders `children` only when the person has allowed that optional category. Use it around any analytics or marketing tag. */
export function ConsentGate({ category, children }) {
  const p = usePrivacy();
  if (!p.config?.optionalTracking || !p[category]) return null;
  return children;
}
