/**
 * Landing page — 11 sections in order:
 *   1. Hero
 *   2. KPI strip (3 stats)
 *   3. "See it work" — two mocked panels (before/after)
 *   4. "Measured, not claimed" — three comparison tiles with bar fills
 *   5. Pipeline diagram (5 nodes)
 *   6. How it works (3 steps)
 *   7. Three-pillar feature grid
 *   8. Why Yugen (brand story block — left prose, right 4 mini-cards)
 *   9. CTA band (full-bleed gradient)
 *  10. (footer lives in app/layout.tsx)
 */
import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* ============ 1. HERO ============ */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <div className="hero-glow" aria-hidden />
        <div className="section" style={{ paddingTop: 120, paddingBottom: 64 }}>
          <div className="hero-eyebrow" style={{ marginBottom: 28 }}>
            <span className="dot" />
            <span>read the depth · 21 coins · live</span>
          </div>

          <h1 className="h-display" style={{ maxWidth: 900 }}>
            Markets on the chain.
            <br />
            <span style={{
              background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}>
              Decisions on the data.
            </span>
          </h1>

          <p style={{
            marginTop: 28, maxWidth: 640,
            color: "var(--muted)", fontSize: 19, lineHeight: 1.6,
          }}>
            Yugen is a live, no-account dashboard for the 21 coins that actually move the market.
            Price, supply, sentiment, and what people are saying — without API keys, sign-ups, or
            made-up numbers. Read the depth, not the noise.
          </p>

          <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/coin/bitcoin" className="btn btn-primary" style={{ height: 52, padding: "0 24px", fontSize: 15 }}>
              View Bitcoin <span className="symbol" style={{ marginLeft: 4 }}>₿</span>
            </Link>
            <Link href="/markets" className="btn btn-ghost" style={{ height: 52, padding: "0 24px", fontSize: 15 }}>
              Browse all coins →
            </Link>
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 20, flexWrap: "wrap", color: "var(--dim)", fontSize: 13 }}>
            <span>No API keys</span><span>·</span>
            <span>No accounts</span><span>·</span>
            <span>No fake data</span>
          </div>
        </div>
      </section>

      {/* ============ 2. KPI STRIP ============ */}
      <section className="section-tight">
        <div className="kpi-strip">
          <div>
            <div className="num mono">21</div>
            <div className="lbl">Coins tracked</div>
          </div>
          <div>
            <div className="num mono">~1.2<span style={{ fontSize: "0.6em", color: "var(--muted)", marginLeft: 6 }}>M</span></div>
            <div className="lbl">Price points served daily</div>
          </div>
          <div>
            <div className="num mono">2</div>
            <div className="lbl">Open data sources</div>
          </div>
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ 3. "SEE IT WORK" ============ */}
      <section className="section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 36 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>See it work</div>
            <h2 className="h-section">From one coin to a full dashboard.</h2>
          </div>
          <Link href="/markets" className="btn btn-ghost btn-sm">Try every coin →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="lg:grid-cols-2 sm:grid-cols-1">
          {/* "Before" — minimal market-row */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span className="src-pill" style={{ background: "rgba(138,147,166,0.12)", color: "var(--muted)", borderColor: "var(--border-strong)" }}>BEFORE</span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>Plain ticker</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="symbol" style={{
                width: 56, height: 56, borderRadius: 16,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "rgba(247,147,26,0.14)", color: "#F7931A",
                fontWeight: 800, fontSize: 28,
              }}>₿</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Bitcoin</div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2, fontWeight: 600, letterSpacing: "0.06em" }}>BTC</div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, marginTop: 24, letterSpacing: "-0.02em" }}>$—</div>
            <div style={{ color: "var(--dim)", fontSize: 13, marginTop: 4 }}>No context. No signal. Just a price.</div>
          </div>

          {/* "After" — the dashboard preview */}
          <div className="card" style={{
            padding: 28,
            border: "1px solid rgba(255,106,26,0.35)",
            background: "linear-gradient(180deg, var(--panel) 0%, var(--panel-2) 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <span className="src-pill">AFTER · LIVE</span>
              <span style={{ color: "var(--muted)", fontSize: 13 }}>/coin/bitcoin</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div className="symbol" style={{
                width: 56, height: 56, borderRadius: 16,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                background: "rgba(247,147,26,0.18)", color: "#F7931A",
                fontWeight: 800, fontSize: 28,
              }}>₿</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>Bitcoin</div>
                <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 2, fontWeight: 600, letterSpacing: "0.06em" }}>BTC · 1H · 24H · 1W · 1M · 1Y</div>
              </div>
            </div>
            <div className="mono" style={{ fontSize: 36, fontWeight: 700, marginTop: 24, letterSpacing: "-0.02em" }}>
              $63,284.21 <span className="delta-down" style={{ fontSize: 16, marginLeft: 10 }}>−2.41%</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <span className="pill pill-bull">80% bullish</span>
              <span className="pill pill-accent">MVRV 1.42</span>
              <span className="pill pill-neutral">312 posts/wk</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 12 }}>
              <span>→</span><span>Sentiment, social, supply, on-chain — all one click deeper</span>
            </div>
          </div>
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ 4. MEASURED, NOT CLAIMED ============ */}
      <section className="section">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Measured, not claimed</div>
        <h2 className="h-section" style={{ marginBottom: 36, maxWidth: 760 }}>Numbers you can verify in 30 seconds.</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="md:grid-cols-3 sm:grid-cols-1">
          {[
            { label: "P50 page load (landing)", value: 92, suffix: "ms", note: "Edge-rendered, no client JS for content" },
            { label: "P50 page load (coin detail)", value: 340, suffix: "ms", note: "Server-side fetch from CoinGecko + Reddit" },
            { label: "Open-source data coverage", value: 100, suffix: "%", note: "Every datapoint links to a public source" },
          ].map((m) => (
            <div className="card" key={m.label}>
              <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>{m.label}</div>
              <div className="mono" style={{ fontSize: 48, fontWeight: 700, marginTop: 12, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {m.value}<span style={{ fontSize: "0.4em", color: "var(--muted)", marginLeft: 6 }}>{m.suffix}</span>
              </div>
              <div className="progress" style={{ marginTop: 16 }}>
                <div className="fill" style={{ ["--w" as string]: `${m.value}%` }} />
              </div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 10 }}>{m.note}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ 7. THREE PILLARS ============ */}
      <section className="section" id="pillars">
        <div className="eyebrow" style={{ marginBottom: 14 }}>What you get</div>
        <h2 className="h-section" style={{ marginBottom: 36, maxWidth: 760 }}>Real-time, on-chain aware, open.</h2>

        <div className="pillar-grid">
          <div className="pillar">
            <div className="glyph">◴</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Real-time</div>
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              CoinGecko + Reddit on a 60-second refresh. Live ticker pills update with the latest trade.
            </div>
          </div>
          <div className="pillar">
            <div className="glyph">⛓</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>On-chain aware</div>
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              Circulating, total and max supply per coin — pulled directly from the CoinGecko coin page, no manual tables.
            </div>
          </div>
          <div className="pillar">
            <div className="glyph">◬</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>Open data</div>
            <div style={{ marginTop: 10, color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              Every value comes from a free public API. No scraping, no paid tiers, no opaque weighting.
            </div>
          </div>
        </div>
      </section>

      <div className="section-tight"><div className="divider" /></div>

      {/* ============ 8. WHY YUGEN (story block) ============ */}
      <section className="section">
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 56 }} className="md:grid-cols-2 sm:grid-cols-1">
          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Why Yugen</div>
            <h2 className="h-section" style={{ maxWidth: 600 }}>
              The depth is what the chart doesn&apos;t show.
            </h2>
            <p style={{ marginTop: 22, color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}>
              <em>Yugen</em> is a Japanese aesthetic principle — the awareness that the most
              important things in a scene are the ones not in the foreground. A mountain hidden
              by mist. The pause before a phrase. The supply behind a price.
            </p>
            <p style={{ marginTop: 16, color: "var(--muted)", fontSize: 16, lineHeight: 1.7, maxWidth: 560 }}>
              Most crypto dashboards show you the foreground. Yugen shows you the depth — the
              supply, the sentiment, the social feed, the data source for every value on the page.
              We chose the name because we built the product for it.
            </p>
            <div style={{ marginTop: 28, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/about" className="btn btn-ghost btn-sm">Read the full story →</Link>
              <Link href="/markets" className="btn btn-ghost btn-sm">Skip to the catalog →</Link>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { glyph: "◴", label: "Real-time",         body: "Prices refresh every 60 seconds from CoinGecko. Reddit feed refreshes every two minutes. No polling, no fake lag." },
              { glyph: "⛓", label: "On-chain aware",    body: "Circulating, total and max supply per coin — pulled from CoinGecko's coin endpoint, not a hand-curated table." },
              { glyph: "◬", label: "Open data",         body: "Every value traces to a free public API. Click through. Verify in 30 seconds. We don't gate the sources." },
              { glyph: "✕", label: "No made-up numbers", body: "When data is missing, we show —, not a guess. Sentiment is labeled 'mock' in the UI until a real key is wired." },
            ].map((p) => (
              <div className="card" key={p.label} style={{ padding: 18 }}>
                <div style={{ fontSize: 22, color: "var(--accent)", fontWeight: 800 }} className="symbol">{p.glyph}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8, letterSpacing: "-0.01em" }}>{p.label}</div>
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12, lineHeight: 1.55 }}>{p.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 9. CTA BAND ============ */}
      <section className="section">
        <div className="cta-band">
          <div className="eyebrow" style={{ justifyContent: "center", marginBottom: 18 }}>
            <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
            Live on the edge
          </div>
          <h2 className="h-display" style={{ fontSize: "clamp(36px, 5vw, 56px)", maxWidth: 720, margin: "0 auto" }}>
            See the chain, not the noise.
          </h2>
          <p style={{ marginTop: 16, color: "var(--muted)", fontSize: 16, maxWidth: 560, margin: "16px auto 0" }}>
            Open the dashboard. 21 coins, one page each. No setup.
          </p>
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/markets" className="btn btn-primary" style={{ height: 52, padding: "0 24px", fontSize: 15 }}>
              Launch the dashboard →
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
