"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchSession, logout as apiLogout, updateProfile as apiUpdateProfile } from "@/lib/client/accountApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authed | guest

  useEffect(() => {
    let alive = true;
    fetchSession()
      .then((u) => {
        if (!alive) return;
        setUser(u);
        setStatus(u ? "authed" : "guest");
      })
      .catch(() => alive && setStatus("guest"));
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback((u) => {
    setUser(u);
    setStatus("authed");
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
      setStatus("guest");
    }
  }, []);

  const updateProfile = useCallback(async (input) => {
    const updated = await apiUpdateProfile(input);
    setUser(updated);
    return updated;
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, updateProfile }),
    [user, status, signIn, signOut, updateProfile],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
