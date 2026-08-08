/**
 * app/news/page.tsx — Crypto News page.
 *
 * Server Component. Fetches initial news from /api/news.
 * Renders NewsFeed client component with infinite scroll.
 */

import Link from "next/link";
import { fetchNews } from "@/lib/news";
import { NewsFeed } from "@/components/news/news-feed";

export const revalidate = 300;

export const metadata = {
  title: "News — Yugen",
  description: "Latest crypto news from CryptoPanic, CoinDesk, Cointelegraph, The Block, and Decrypt.",
};

export default async function NewsPage() {
  let initialItems: Awaited<ReturnType<typeof fetchNews>> = [];
  let loadError: string | null = null;

  try {
    initialItems = await fetchNews(20);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load news";
  }

  return (
    <>
      <header className="section-tight" style={{ paddingTop: 56, paddingBottom: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>News</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 className="h-section" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
              Crypto News <span style={{ color: "var(--muted)", fontWeight: 700 }}>aggregated & filtered</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24, color: "var(--muted)", fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Sources</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--accent)" }}>CryptoPanic + RSS</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Refresh</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--text)" }}>~5 min</div>
            </div>
          </div>
        </div>
      </header>

      <div className="section-tight" style={{ paddingTop: 32 }}>
        {loadError ? (
          <div className="card" style={{ borderColor: "var(--bear)" }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>Could not load news</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{loadError}</div>
            <div style={{ color: "var(--dim)", fontSize: 13, marginTop: 8 }}>
              The feed will retry automatically. You can also refresh the page.
            </div>
          </div>
        ) : (
          <NewsFeed initialItems={initialItems} limit={20} />
        )}
      </div>

      {/* Filter by coin section */}
      <section className="section-tight" style={{ paddingTop: 48 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Filter by Coin</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "LINK", "AVAX", "MATIC"].map((sym) => (
            <Link
              key={sym}
              href={`/news?coin=${sym.toLowerCase()}`}
              className="btn btn-secondary btn-sm"
              style={{ height: 36, fontSize: 12 }}
            >
              {sym}
            </Link>
          ))}
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: 8 }}>
        <div style={{ color: "var(--dim)", fontSize: 12, lineHeight: 1.6 }}>
          News aggregated from <a href="https://cryptopanic.com" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>CryptoPanic</a>
          and RSS feeds (CoinDesk, Cointelegraph, The Block, Decrypt, Bitcoin Magazine).
          Updates every ~5 minutes. Click any article to read on the source site.
        </div>
      </section>
    </>
  );
}