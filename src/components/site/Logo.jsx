import Link from "next/link";
import { BRAND_NAME, LOGO_URL } from "@/lib/env";

/** Placeholder mark. Replace by setting NEXT_PUBLIC_LOGO_URL (later: uploaded from the admin panel). */
function Mark({ className = "size-9" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="16" fill="#1E4335" />
      <path d="M20 16h14a9 9 0 0 1 0 16H20zM20 32h16a8 8 0 0 1 0 16H20z" fill="none" stroke="#FFF8F0" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="46" cy="18" r="4" fill="#E9A23B" />
    </svg>
  );
}

export default function Logo({ inverted = false, className = "" }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 rounded-lg ${className}`} aria-label={`${BRAND_NAME} home`}>
      {LOGO_URL ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo URL is admin-configured and may be any host
        <img src={LOGO_URL} alt="" className="size-9 rounded-lg object-contain" />
      ) : (
        <Mark />
      )}
      <span className={`font-display text-base leading-tight font-bold tracking-tight min-[400px]:text-lg ${inverted ? "text-white" : "text-brand"}`}>
        {BRAND_NAME}
      </span>
    </Link>
  );
}
