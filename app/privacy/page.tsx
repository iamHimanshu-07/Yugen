/**
 * Privacy Policy page
 * Privacy policy for Yugen cryptocurrency dashboard
 */
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Yugen",
  description: "Privacy policy for the Yugen cryptocurrency dashboard",
};

export default function PrivacyPage() {
  return (
    <>
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 16 }}>
            <span className="dot" />
            <span>legal · privacy</span>
          </div>
          <h1 className="h-display" style={{ maxWidth: 720 }}>
            Privacy Policy
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              How we handle your data and privacy
            </span>
          </h1>
        </div>
      </section>

      <section className="section-tight">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          <span className="dot" />
          <span>How it's built</span>
        </div>
        <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
          Next.js 16 on the edge, free data sources.
        </h2>
        <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}>
          <p>
            Yugen is a <strong>Next.js 16</strong> app running on Vercel&apos;s edge. Every
            coin page is statically generated at build time and revalidated every 60 seconds.
            The chart endpoint is a Route Handler that proxies CoinGecko&apos;s market-chart through
            an in-memory LRU so the upstream URL stays out of the client bundle.
          </p>
          <p>
            The price chart is <strong>Apache ECharts</strong>, loaded only on the client via
            dynamic import. The dashboard layout is hand-rolled CSS — no shadcn/ui, no
            @radix-ui, no design-system library. Six primitives, all hand-built.
          </p>
          <p style={{ marginTop: 16 }}>
            <strong>No database. No accounts. No API keys.</strong> The whole app boots from
            a fresh clone in under a minute, and the deployment is a single command.
          </p>
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          <span className="dot" />
          <span>navigation · back to site</span>
        </div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-ghost">
            ← Home
          </Link>
          <Link href="/about" className="btn btn-ghost">
            About Yugen →
          </Link>
          <Link href="/markets" className="btn btn-primary">
            View Cryptocurrency Data →
          </Link>
        </div>
      </section>
    </>
  );
}