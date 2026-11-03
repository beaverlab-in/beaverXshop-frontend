const mediaHost = process.env.NEXT_PUBLIC_MEDIA_HOST; // e.g. media.example.com (Cloudflare R2 custom domain)
const isProd = process.env.NODE_ENV === "production";

// Origins the browser may talk to. The API origin comes from the same env var the app uses.
const apiOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").origin;
  } catch {
    return "";
  }
})();

// Content-Security-Policy (production only: the dev server needs eval for hot reload).
// 'unsafe-inline' scripts are required for Next.js's inline hydration data; a per-request nonce would force every
// page to be rendered dynamically and defeat the static shell. Everything else is locked down:
//  - scripts load only from this site and Razorpay Checkout
//  - Razorpay's payment window is the only frame we allow, and nobody may frame us
//  - the browser may call only this site, our API, and Razorpay
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.razorpay.com${mediaHost ? ` https://${mediaHost}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://api.razorpay.com https://lumberjack.razorpay.com`.trim(),
  "frame-src https://api.razorpay.com https://checkout.razorpay.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ...(isProd
    ? [
        { key: "Content-Security-Policy", value: csp },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Lets us build the demo-mode and API-mode variants side by side for end-to-end tests.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["127.0.0.1"], // dev-only: lets us test with an isolated localStorage origin
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: mediaHost ? [{ protocol: "https", hostname: mediaHost }] : [],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Private areas must never be stored by shared caches.
      { source: "/(account|admin|checkout|cart|login)/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default nextConfig;
