/**
 * /about — the Yugen story. Server-rendered, follows the design system but
 * uses a slightly more relaxed typographic rhythm than the marketing pages.
 */
import Link from "next/link";

export const metadata = {
  title: "About — Yugen",
  description:
    "The story behind Yugen: what it is, who it's for, how it's built, and where it goes next.",
};

export default function AboutPage() {
  return (
    <>
      <section style={{ paddingTop: 120, paddingBottom: 24 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 28 }}>
            <span className="dot" />
            <span>about · read the depth</span>
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
        eyebrow="What it is"
        title="A live, no-account dashboard for 14 coins."
      >
        <p>
          Yugen pulls price, market cap, supply, sentiment and social signal for the
          coins that actually matter — Bitcoin, Ethereum, Solana, the stables, the
          privacy coins. No account, no API keys, no scraping, no fake numbers.
        </p>
        <p>
          Every value on the page traces back to a public, free data source you can verify
          in 30 seconds. CoinGecko for prices. Reddit for social signal. Nothing else.
        </p>
      </Section>

      <Section
        eyebrow="Why it exists"
        title="Two failure modes in crypto dashboards."
      >
        <p>
          There are two failure modes in crypto dashboards. The first is the
          <strong> trading-terminal trap</strong> — spinning numbers, seven columns of indicators,
          a chart so dense you can&apos;t see the price. The depth disappears under the noise.
        </p>
        <p>
          The second is the <strong>Streamlit trap</strong> — a research notebook dressed up
          as a product. Slow, ugly, auth-walled, or worse: fake data behind the curtain.
        </p>
        <p>
          Yugen is the third path: the visual polish of a product launch, the data integrity
          of a research tool, the open-ness of a public utility. Every chart, every metric,
          every post links back to a source you can hit yourself.
        </p>
      </Section>

      <Section
        eyebrow="The name"
        title="A Japanese aesthetic principle."
      >
        <p>
          <em>Yugen</em> is a Japanese aesthetic principle — the awareness that the most
          important things in a scene are the ones not in the foreground. A mountain hidden
          by mist. The pause before a phrase. The supply behind a price.
        </p>
        <p>
          Most crypto dashboards show you the foreground. Yugen shows you the depth — the
          supply, the sentiment, the social feed, the data source for every value on the page.
          We chose the name because we built the product for it.
        </p>
      </Section>

      <Section
        eyebrow="How it's built"
        title="Next.js 16 on the edge, free data sources."
      >
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
        <p>
          <strong>No database. No accounts. No API keys.</strong> The whole app boots from
          a fresh clone in under a minute, and the deployment is a single command.
        </p>
      </Section>

      <Section
        eyebrow="Where it goes"
        title="Honest extensions, not more features."
      >
        <p>
          The roadmap is constrained by one rule: <em>don&apos;t add anything that requires a
          key, an account, or opaque weighting.</em> That means:
        </p>
        <ul style={{ color: "var(--muted)", fontSize: 16, lineHeight: 1.7, paddingLeft: 22 }}>
          <li>Wire a real sentiment source (CryptoPanic / LunarCrush — free tiers exist) when the catalog needs it.</li>
          <li>Expand the catalog once a meaningful 15th coin (e.g. stablecoin peg stability) is requested.</li>
          <li>Add a public RSS feed of &quot;unusual activity&quot; alerts sourced from the existing CoinGecko response.</li>
        </ul>
        <p style={{ marginTop: 16 }}>
          What we won&apos;t add: WebSocket price spam, paid tiers, watchlists that require
          an account, ads, tokens. The depth is the product.
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
  // Generate ID from eyebrow for anchor links
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