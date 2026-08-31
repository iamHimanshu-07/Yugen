import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How It Works — Yugen",
  description: "A deep dive into the architecture and data pipeline of Yugen.",
};

export default function HowItWorks() {
  return (
    <div style={{ paddingTop: 120, paddingBottom: 80 }}>
      <section className="section">
        <div className="hero-eyebrow" style={{ marginBottom: 28 }}>
          <span className="dot" />
          <span>architecture · pipeline · open data</span>
        </div>

        <h1 className="h-display" style={{ maxWidth: 900 }}>
          Built for depth.
          <br />
          <span style={{
            background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}>
            Engineered for transparency.
          </span>
        </h1>

        <p style={{
          marginTop: 28, maxWidth: 640,
          color: "var(--muted)", fontSize: 19, lineHeight: 1.6,
        }}>
          Yugen isn't a trading bot or a prediction engine. It's a high-fidelity window
          into open market data, designed to eliminate the friction between a coin's
          current price and its underlying signal.
        </p>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ PIPELINE (Moved from Home) ============ */}
      <section className="section">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Under the hood</div>
        <h2 className="h-section" style={{ marginBottom: 36, maxWidth: 760 }}>A request, end to end.</h2>

        <div className="pipeline">
          {[
            { ix: "01", nm: "Request",      ds: "Your click, server-rendered" },
            { ix: "02", nm: "CoinGecko",    ds: "Free public API · 60s cache" },
            { ix: "03", nm: "Reddit JSON",  ds: "No key, .json suffix trick" },
            { ix: "04", nm: "Compose",      ds: "Server Component, streamed" },
            { ix: "05", nm: "Render",       ds: "Edge-cached HTML, hydrate" },
          ].map((n) => (
            <div className="node" key={n.ix}>
              <div className="ix">{n.ix}</div>
              <div className="nm">{n.nm}</div>
              <div className="ds">{n.ds}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 48, padding: 24, background: "var(--panel)", borderRadius: 16, border: "1px solid var(--border-strong)", maxWidth: 800 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Why this architecture?</div>
          <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
            By using Next.js Server Components and a strict 60-second revalidation period,
            we move the heavy lifting of API orchestration to the server. This means the
            client receives fully formed HTML, resulting in sub-500ms page loads and
            zero layout shift.
          </p>
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ HOW IT WORKS (Moved from Home) ============ */}
      <section className="section">
        <div className="eyebrow" style={{ marginBottom: 14 }}>The Process</div>
        <h2 className="h-section" style={{ marginBottom: 48, maxWidth: 760 }}>Three steps to a live view.</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="md:grid-cols-3 sm:grid-cols-1">
          {[
            { ix: "01", title: "Pick a coin", body: "Browse the catalog of 21 — Bitcoin, Ethereum, Solana, all the way through Monero, Zcash, and the stables." },
            { ix: "02", title: "Read the signal", body: "Price chart, sentiment bar, top-of-feed posts and supply snapshot — all on one page, no scrolling back and forth." },
            { ix: "03", title: "Share the link", body: "Every URL is public. Send a Bitcoin chart, an Ethereum sentiment snapshot, or the full Solana dashboard to anyone." },
          ].map((s) => (
            <div key={s.ix}>
              <div className="mono" style={{ fontSize: 56, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.04em", lineHeight: 1 }}>{s.ix}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em" }}>{s.title}</div>
              <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      <section className="section" style={{ textAlign: "center" }}>
        <h2 className="h-section" style={{ marginBottom: 24 }}>Ready to explore?</h2>
        <Link href="/markets" className="btn btn-primary">Back to Markets →</Link>
      </section>
    </div>
  );
}
