/**
 * Terms of Service page
 * Terms and conditions for using Yugen cryptocurrency dashboard
 */
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Yugen",
  description: "Terms and conditions for the Yugen cryptocurrency dashboard",
};

export default function TermsPage() {
  return (
    <>
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 16 }}>
            <span className="dot" />
            <span>legal · terms</span>
          </div>
          <h1 className="h-display" style={{ maxWidth: 720 }}>
            Terms of Service
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Terms governing your use of Yugen
            </span>
          </h1>
        </div>
      </section>

      <section className="section-tight">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          <span className="dot" />
          <span>What it is</span>
        </div>
        <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
          A live, no-account dashboard for 21 coins.
        </h2>
        <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}>
          <p>
            Yugen pulls price, market cap, supply, sentiment and social signal for the
            coins that actually matter — Bitcoin, Ethereum, Solana, the stables, the
            privacy coins. No account, no API keys, no scraping, no fake numbers.
          </p>
          <p>
            Every value on the page traces back to a public, free data source you can verify
            in 30 seconds. CoinGecko for prices. Reddit for social signal. Nothing else.
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