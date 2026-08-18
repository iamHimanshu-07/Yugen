/**
 * Disclaimer page
 * Legal disclaimer for Yugen cryptocurrency dashboard
 */
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer — Yugen",
  description: "Legal disclaimer for the Yugen cryptocurrency dashboard",
};

export default function DisclaimerPage() {
  return (
    <>
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 16 }}>
            <span className="dot" />
            <span>legal · disclaimer</span>
          </div>
          <h1 className="h-display" style={{ maxWidth: 720 }}>
            Disclaimer
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Important legal information
            </span>
          </h1>
        </div>
      </section>

      <section className="section-tight">
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          <span className="dot" />
          <span>Where it goes</span>
        </div>
        <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
          Honest extensions, not more features.
        </h2>
        <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}>
          <p>
            The roadmap is constrained by one rule: <em>don&apos;t add anything that requires a
            key, an account, or opaque weighting.</em> That means:
          </p>
          <ul style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, paddingLeft: 22 }}>
            <li>
              Wire a real sentiment source (CryptoPanic / LunarCrush — free tiers exist) when the
              catalog needs it.
            </li>
            <li>
              Expand the catalog once a meaningful 15th coin (e.g. stablecoin peg stability) is
              requested.
            </li>
            <li>
              Add a public RSS feed of "unusual activity" alerts sourced from the existing
              CoinGecko response.
            </li>
          </ul>
          <p style={{ marginTop: 16 }}>
            What we won&apos;t add: WebSocket price spam, paid tiers, watchlists that require an
            account, ads, tokens. The depth is the product.
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