import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import JsonLd from "@/components/site/JsonLd";
import { ToastProvider } from "@/providers/ToastProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/providers/CartProvider";
import CartSync from "@/components/site/CartSync";
import { getPublicSettings } from "@/lib/data/settings";
import { BRAND_NAME, SITE_URL } from "@/lib/env";
import { organizationJsonLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND_NAME} | Educational electronics, robotics and IoT`, template: `%s | ${BRAND_NAME}` },
  description: "Educational electronics, robotics and IoT kits that make learning hands-on. Build, explore, learn and create.",
  applicationName: BRAND_NAME,
  icons: { icon: "/favicon.svg" },
  formatDetection: { telephone: false },
};

export const viewport = { themeColor: "#FFFFFF" };

export default async function RootLayout({ children }) {
  const { company } = await getPublicSettings();
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={inter.variable}>
      <body className="flex min-h-dvh flex-col">
        <JsonLd data={organizationJsonLd(company)} />
        <ToastProvider>
          <AuthProvider>
            <CartProvider>
              <CartSync />
              {/* data-site-chrome lets the admin layout hide the shop header/footer (see app/admin/layout.js) */}
              <div data-site-chrome className="contents">
                <Header />
              </div>
              <main id="main" className="flex-1">
                {children}
              </main>
              <div data-site-chrome className="contents">
                <Footer />
              </div>
            </CartProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
