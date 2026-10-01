import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import { CompareTray } from "@/components/layout/compare-tray";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RevealObserver } from "@/components/motion/reveal-observer";
import { AppProviders } from "@/components/providers/app-providers";
import { InlineScript } from "@/components/ui/inline-script";
import { SITE } from "@/lib/constants";
import { env } from "@/lib/env";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "EstateX — Exceptional homes, thoughtfully discovered",
    template: "%s · EstateX",
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    title: "EstateX — Exceptional homes, thoughtfully discovered",
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${geist.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        {/* Enables scroll-reveal styles only when JavaScript runs, so content is never hidden without it. */}
        <InlineScript html="document.documentElement.setAttribute('data-js','')" />
      </head>
      <body className="min-h-dvh">
        <AppProviders>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="outline-none">
            {children}
          </main>
          <SiteFooter />
          <CompareTray />
          <RevealObserver />
        </AppProviders>
      </body>
    </html>
  );
}
