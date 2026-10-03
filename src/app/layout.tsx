import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { Suspense } from "react";
import { SignedInNotice } from "@/components/auth/signed-in-notice";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartProvider } from "@/components/cart/cart-provider";
import { SessionProvider } from "@/components/session/session-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ToastProvider } from "@/components/ui/toast";
import { emptyCart } from "@/lib/cart/pricing";
import { commerce, siteConfig } from "@/lib/config";
import { formatPrice } from "@/lib/format";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const serif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const sans = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "NOIRÉ | Modern fragrance house",
    template: "%s | NOIRÉ",
  },
  description: siteConfig.description,
  applicationName: "NOIRÉ",
  // Titles and descriptions are left out here on purpose: Next fills og:/twitter: from each page's
  // own title and description, so shared links show the page, not the home page.
  openGraph: {
    type: "website",
    siteName: "NOIRÉ",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f3ed",
};

// Applies a saved dark choice before first paint (no flash). Light is the default.
const themeScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 bg-ink px-4 py-3 text-[13px] text-ivory focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <ToastProvider>
          <CartProvider initialCart={emptyCart()}>
            <SessionProvider>
            <div role="region" aria-label="Announcement" className="bg-night px-4 py-2.5 text-center text-[11px] uppercase tracking-[0.16em] text-cream/90">
              <p>
                Free delivery<span className="hidden sm:inline"> across Nigeria</span> on orders over{" "}
                {formatPrice(commerce.freeShippingThreshold)}
                <span className="hidden sm:inline"> · Pay on delivery</span>
              </p>
            </div>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <CartDrawer />
            <Suspense fallback={null}>
              <SignedInNotice />
            </Suspense>
            </SessionProvider>
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
