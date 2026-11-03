import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import JsonLd from "@/components/site/JsonLd";
import { ToastProvider } from "@/providers/ToastProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import { getPublicSettings } from "@/lib/data/settings";
import { BRAND_NAME, SITE_URL } from "@/lib/env";
import { organizationJsonLd } from "@/lib/seo";

const heading = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const body = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND_NAME} | Educational electronics, robotics and IoT`, template: `%s | ${BRAND_NAME}` },
  description: "Educational electronics, robotics and IoT kits that make learning hands-on. Build, explore, learn and create.",
  applicationName: BRAND_NAME,
  icons: { icon: "/favicon.svg" },
  formatDetection: { telephone: false },
};

export const viewport = { themeColor: "#FFF8F0" };

export default async function RootLayout({ children }) {
  const { company } = await getPublicSettings();
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${heading.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationJsonLd(company)} />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
