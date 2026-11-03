"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import OtpInput from "@/components/ui/OtpInput";
import { Card } from "@/components/ui/Layout";
import { LockIcon } from "@/components/ui/Icons";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { DEMO_OTP, requestOtp, verifyOtp } from "@/lib/client/accountApi";
import { formatMobile, isValidEmail, normalizeMobile } from "@/lib/validation";
import { IS_DEMO } from "@/lib/env";

// Only same-site relative paths are allowed as post-login destinations (prevents open redirects).
function safeNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const { signIn, updateProfile, status, user } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState("mobile"); // mobile | otp | profile
  const [mobileInput, setMobileInput] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpMode, setOtpMode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [profileErrors, setProfileErrors] = useState({});
  const submitting = useRef(false);

  // Already signed in: nothing to do here.
  useEffect(() => {
    if (status === "authed" && step === "mobile" && user) router.replace(next);
  }, [status, step, user, router, next]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(number) {
    setBusy(true);
    setError("");
    try {
      const res = await requestOtp(number);
      setOtpMode(res?.mode ?? "");
      setCooldown(res?.cooldownSeconds ?? 30);
      setOtp("");
      setStep("otp");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function onMobileSubmit(e) {
    e.preventDefault();
    const n = normalizeMobile(mobileInput);
    if (!n) return setError("Enter a valid 10-digit Indian mobile number.");
    setMobile(n);
    sendCode(n);
  }

  async function verify(code) {
    if (submitting.current) return;
    if (code.length !== 6) return setError("Enter the 6-digit code.");
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const u = await verifyOtp(mobile, code);
      signIn(u);
      if (!u.name) {
        setStep("profile");
      } else {
        toast.success("You're logged in.");
        router.replace(next);
      }
    } catch (e) {
      setError(e.message);
      setOtp("");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function onProfileSubmit(e) {
    e.preventDefault();
    const errors = {};
    if (profile.name.trim().length < 2) errors.name = "Please tell us your name.";
    if (profile.email && !isValidEmail(profile.email)) errors.email = "Enter a valid email address or leave it blank.";
    setProfileErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      await updateProfile(profile);
      toast.success("Welcome aboard!");
      router.replace(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-tint text-brand">
        <LockIcon className="size-6" />
      </div>

      {IS_DEMO && (
        <p className="mb-6 rounded-md border border-accent/60 bg-accent/15 p-3 text-sm" role="note">
          <strong>Demo mode.</strong> No message is sent. Use the code <strong className="tabular-nums">{DEMO_OTP}</strong> to continue.
        </p>
      )}
      {!IS_DEMO && otpMode === "mock" && step === "otp" && (
        <p className="mb-6 rounded-md border border-accent/60 bg-accent/15 p-3 text-sm" role="note">
          <strong>Development mode.</strong> WhatsApp delivery is not connected. The code is printed in the server console.
        </p>
      )}

      {step === "mobile" && (
        <form onSubmit={onMobileSubmit} noValidate>
          <h1 className="text-3xl font-extrabold text-brand">Log in or sign up</h1>
          <p className="mt-2 text-muted">Enter your mobile number. We&apos;ll send a one-time code to verify it.</p>
          <div className="mt-6">
            <Field
              label="Mobile number"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="98765 43210"
              value={mobileInput}
              onChange={(e) => {
                setMobileInput(e.target.value);
                setError("");
              }}
              error={error}
              hint="Indian mobile numbers only. +91 is added for you."
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" block className="mt-6" loading={busy}>
            Send code
          </Button>
          <p className="mt-4 text-center text-xs text-muted">
            By continuing you agree to our{" "}
            <Link href="/legal/terms-and-conditions" className="underline underline-offset-2">Terms</Link> and{" "}
            <Link href="/legal/privacy-policy" className="underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </form>
      )}

      {step === "otp" && (
        <div>
          <h1 className="text-3xl font-extrabold text-brand">Enter the code</h1>
          <p className="mt-2 text-muted">
            We sent a 6-digit code to <strong className="text-ink">{formatMobile(mobile)}</strong>.{" "}
            <button type="button" className="font-semibold text-brand underline underline-offset-4" onClick={() => { setStep("mobile"); setError(""); }}>
              Change
            </button>
          </p>
          <div className="mt-6">
            <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(""); }} onComplete={verify} disabled={busy} invalid={Boolean(error)} />
            <p className="mt-2 min-h-5 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          </div>
          <Button size="lg" block className="mt-4" loading={busy} onClick={() => verify(otp)}>
            Verify and continue
          </Button>
          <p className="mt-5 text-center text-sm text-muted">
            {cooldown > 0 ? (
              <>Resend code in <span className="tabular-nums">{cooldown}s</span></>
            ) : (
              <button type="button" className="font-semibold text-brand underline underline-offset-4" onClick={() => sendCode(mobile)} disabled={busy}>
                Resend code
              </button>
            )}
          </p>
          <p className="mt-2 text-center text-xs text-muted">The code expires in 5 minutes.</p>
        </div>
      )}

      {step === "profile" && (
        <form onSubmit={onProfileSubmit} noValidate>
          <h1 className="text-3xl font-extrabold text-brand">Welcome! One last thing</h1>
          <p className="mt-2 text-muted">Tell us what to call you. This appears on your orders and invoices.</p>
          <div className="mt-6 space-y-4">
            <Field label="Full name" autoComplete="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} error={profileErrors.name} autoFocus />
            <Field label="Email" optional type="email" autoComplete="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} error={profileErrors.email} hint="For order receipts. We won't spam you." />
          </div>
          {error && <p className="mt-3 text-sm font-medium text-danger" role="alert">{error}</p>}
          <Button type="submit" size="lg" block className="mt-6" loading={busy}>
            Continue
          </Button>
        </form>
      )}
    </Card>
  );
}
