/**
 * /about — the Yugen manifesto and technical history.
 *
 * A deep-dive into the philosophy of "reading the depth" and the
 * architectural decisions that make the dashboard fast, verifiable, and honest.
 */
import Link from "next/link";

export const metadata = {
  title: "About — Yugen",
  description:
    "The story behind Yugen: a commitment to verifiable data, institutional-grade signals, and the aesthetic of the unseen.",
};

export default function AboutPage() {
  return (
    <>
      <section style={{ paddingTop: 120, paddingBottom: 24 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 28 }}>
            <span className="dot" />
            <span>manifesto · read the depth</span>
          </div>
          <h1 className="h-display" style={{ maxWidth: 880 }}>
            Yugen is a dashboard
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              that knows what to leave out.
            </span>
          </h1>
        </div>
      </section>

      <Section
        eyebrow="The Philosophy"
        title="Read the depth, not the noise."
      >
        <p>
          Most crypto dashboards are designed for the foreground: flashing prices,
          hyper-active candles, and a deluge of indicators that create an illusion of
          control. We call this the <strong>trading-terminal trap</strong>. When everything
          is highlighted, nothing is important.
        </p>
        <p>
          <em>Yugen</em> is a Japanese aesthetic principle — the awareness that the most
          important things in a scene are the ones not in the foreground. A mountain hidden
          by mist. The pause before a phrase. The supply behind a price.
        </p>
        <p>
          We built Yugen to shift the focus from <em>what</em> is happening to <em>why</em> it
          is happening. By stripping away the noise, we reveal the depth: the circulating
          supply, the social sentiment, and the institutional signals that actually drive
          market movement.
        </p>
      </Section>

      <Section
        eyebrow="The Architecture"
        title="Built for speed, designed for honesty."
      >
        <p>
          The technical goal for Yugen was simple: <strong>zero friction</strong>. No accounts,
          no API keys, and no waiting. To achieve this, we built a high-performance pipeline
          using Next.js 16 on the edge.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }} className="md:grid-cols-1">
          <div className="card" style={{ padding: 20, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontWeight: 800, marginBottom: 8, color: "var(--accent)" }}>Multi-API Fallback</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              To ensure 100% uptime, Yugen uses a parallel fallback chain:
              CoinGecko &rarr; CoinPaprika &rarr; Binance &rarr; KuCoin. If one source
              stutters, the dashboard remains live.
            </div>
          </div>
          <div className="card" style={{ padding: 20, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ fontWeight: 800, marginBottom: 8, color: "var(--accent)" }}>Single-Flight Requests</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>
              During parallel page generation, we implement a request-coalescing pattern
              that prevents "thundering herd" API calls, keeping our upstream sources
              healthy and our build times lean.
            </div>
          </div>
        </div>
        <p style={{ marginTop: 24 }}>
          Every coin page is statically generated and revalidated every 60 seconds.
          The result is a site that feels like a local app but scales to thousands of users.
        </p>
      </Section>

      <Section
        eyebrow="Pro Signals"
        title="Beyond the price candle."
      >
        <p>
          Price is a lagging indicator. To read the depth, you need leading signals.
          Yugen incorporates institutional-grade data typically reserved for professional
          terminals:
        </p>
        <ul style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.8, paddingLeft: 22, marginTop: 16 }}>
          <li>
            <strong style={{ color: "var(--text)" }}>Funding Rates:</strong> Pulled live from
            Binance Futures to detect market bias. High positive funding suggests
            over-leveraged longs; negative suggests a short-squeeze potential.
          </li>
          <li style={{ marginTop: 8 }}>
            <strong style={{ color: "var(--text)" }}>Liquidity Depth:</strong> Sourced via
            DexScreener to measure "exit capacity". We show you if a coin has the
            liquidity to support its market cap or if it's a liquidity trap.
          </li>
          <li style={{ marginTop: 8 }}>
            <strong style={{ color: "var(--text)" }}>Social Signal:</strong> Real-time
            sentiment analysis from Reddit, providing a raw pulse of the community
            without the filter of "influencer" narratives.
          </li>
        </ul>
      </Section>

      <Section
        eyebrow="The Comparison Engine"
        title="Relative performance, normalized."
      >
        <p>
          Comparing Bitcoin ($60k) to Dogecoin ($0.10) on a linear scale is useless.
          Yugen solves this through <strong>Relative Normalization</strong>.
        </p>
        <p>
          Our engine snaps every selected coin to a baseline of 100 at the start of the
          chosen date range. The resulting lines represent the <em>percentage change</em>
          from that point. This allows you to see exactly which asset is outperforming the
          others, regardless of their nominal price.
        </p>
      </Section>

      <Section
        eyebrow="The Ethos"
        title="Verifiable. Open. Honest."
      >
        <p>
          The biggest problem in crypto data is the "black box" — proprietary weights,
          opaque aggregators, and hidden fees. Yugen is the antidote.
        </p>
        <p>
          We use no proprietary algorithms. Every value on every page is a direct
          reflection of a public data source. If a number is missing, we show
          <code style={{ color: "var(--accent)" }}>—</code>, not a guess. We believe
          that the only way to build trust in this industry is to provide a
          transparent path back to the source.
        </p>
      </Section>

      <section className="section">
        <div className="card-soft" style={{ padding: 36, textAlign: "center" }}>
          <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
            <span className="dot" />
            <span>back to the surface</span>
          </div>
          <h2 className="h-display" style={{ fontSize: "clamp(28px, 4vw, 44px)", maxWidth: 640, margin: "0 auto" }}>
            Now go read the depth.
          </h2>
          <div style={{ marginTop: 28, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/markets" className="btn btn-primary" style={{ height: 52, padding: "0 24px", fontSize: 15 }}>
              Open the catalog →
            </Link>
            <Link href="/coin/bitcoin" className="btn btn-ghost" style={{ height: 52, padding: "0 24px", fontSize: 15 }}>
              Or just Bitcoin <span className="symbol">₿</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  const sectionId = eyebrow
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return (
    <section className="section-tight" id={sectionId}>
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 56 }} className="md:grid-cols-1">
        <div>
          <div className="eyebrow" style={{ marginBottom: 14 }}>{eyebrow}</div>
          <h2 className="h-section" style={{ fontSize: "clamp(24px, 3vw, 34px)" }}>
            {title}
          </h2>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 720 }}>
          {children}
        </div>
      </div>
    </section>
  );
}
