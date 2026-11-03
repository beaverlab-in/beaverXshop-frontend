import { absoluteUrl } from "@/lib/env";

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/cart", "/login", "/api/"] }],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
