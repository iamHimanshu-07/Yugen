/**
 * Root layout — dark by default, Inter + JetBrains Mono via next/font,
 * global watermark glyph. Every page renders inside .app-shell.
 */
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TopNav } from "@/components/nav";
import { StatusIndicator } from "@/components/status-indicator";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "Yugen",
  description:
    "Live price, sentiment, and social signal for the 14 coins that actually matter. No API keys, no accounts, no made-up numbers.",
  metadataBase: new URL("https://yugen-x.vercel.app"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "https://yugen-x.vercel.app/feed.xml", title: "Yugen — Latest crypto news" },
      ],
    },
  },
  openGraph: {
    title: "Yugen" ,
    description:
      "Live price, sentiment, and social signal for the 14 coins that actually matter. No API keys, no accounts.",
    type: "website",
    url: "https://yugen-x.vercel.app",
    siteName: "Yugen",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yugen — read the depth",
    description:
      "Live price, sentiment, and social signal for the 14 coins that actually matter.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0F",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const footer = await SiteFooter();
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body>
        <div className="app-shell" data-watermark="◬">
          <TopNav />
          <main style={{ position: "relative", zIndex: 1 }}>{children}</main>
          {footer}
        </div>
      </body>
    </html>
  );
}

async function SiteFooter() {
  const status = await StatusIndicator();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span className="symbol" style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
              color: "#0A0B0F", fontWeight: 800, fontSize: 16,
            }}>◬</span>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>Yugen</span>
          </div>
          <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, maxWidth: 280 }}>
            Live price, sentiment and social signal for the coins that matter — directly from open data sources.
          </p>
          <div style={{ marginTop: 18 }}>
            {status}
          </div>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/markets">Markets</a></li>
            <li><a href="/how-it-works">How it works</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div>
        <div>
          <h4>Data</h4>
          <ul>
            <li><a href="https://www.coingecko.com" target="_blank" rel="noopener">CoinGecko ↗</a></li>
            <li><a href="https://www.reddit.com" target="_blank" rel="noopener">Reddit ↗</a></li>
            <li><a href="https://www.binance.com" target="_blank" rel="noopener">Binance ↗</a></li>
            <li><a href="https://dexscreener.com" target="_blank" rel="noopener">DexScreener ↗</a></li>
          </ul>
        </div>
        <div>
          <h4>Resources</h4>
          <ul>
            <li><a href="/about">The story</a></li>
            <li><a href="https://github.com/iamHimanshu-07/Yugen" target="_blank" rel="noopener">GitHub ↗</a></li>
          </ul>
        </div>
        <div>
          <h4>Legal</h4>
          <ul>
            <li><a href="/disclaimer">Disclaimer</a></li>
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Yugen — read the depth.</span>
        <span style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span>Not financial advice.</span>
        </span>
      </div>
    </footer>
  );
}
