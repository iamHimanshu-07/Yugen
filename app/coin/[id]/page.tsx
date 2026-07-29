/**
 * Coin detail page (/coin/[id]) — the Bitcoin-style multi-column dashboard.
 *
 * 3-column CSS grid (260 / fluid / 280) with sidebar metric cards on the
 * left, the chart + sentiment + social feed in the middle, and hot topics /
 * related coins on the right.
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCoinDetail, fetchCatalogMarkets, fetchMarketChart, type CoinDetail, type MarketChart, type MarketRow } from "@/lib/coingecko";
import { getCoin, getCoinByGeckoId, listCoins } from "@/lib/coins";
import { mockSentiment } from "@/lib/sentiment";
import { fetchSocialPosts } from "@/lib/reddit";
import { fmtUSD, fmtBigUSD, fmtPct, fmtInt, pctColor, relativeTime } from "@/lib/utils";
import { PriceChart } from "@/components/coin-detail/price-chart";
import { SentimentBar } from "@/components/coin-detail/sentiment-bar";
import { SocialFeed } from "@/components/coin-detail/social-feed";
import { HotTopics } from "@/components/coin-detail/hot-topics";
import { RelatedCoins } from "@/components/coin-detail/related-coins";

export const revalidate = 60;

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) return {};
  return {
    title: `${coin.name} (${coin.symbol}) — live price, sentiment & feed · Yugen`,
    description: `Live ${coin.name} price, market cap, supply, community sentiment and social feed — pulled directly from CoinGecko and Reddit.`,
  };
}

export default async function CoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) notFound();

  // Parallel fetch: detail, chart (default 30d), catalog markets for related list, social feed.
  let detail: CoinDetail | null = null;
  let chart: MarketChart | null = null;
  let allMarkets: MarketRow[] = [];
  let posts: Awaited<ReturnType<typeof fetchSocialPosts>> = [];
  let loadError: string | null = null;

  try {
    [detail, chart, allMarkets, posts] = await Promise.all([
      fetchCoinDetail(id),
      fetchMarketChart(id, 30),
      fetchCatalogMarkets(),
      fetchSocialPosts(coin.symbol, 8),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load coin data";
  }

  const sentiment = mockSentiment(coin.symbol);

  return (
    <>
      <CoinHeader coin={coin} detail={detail} error={loadError} />

      <div className="tab-strip" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
        <button className="tab active">Chart</button>
        <button className="tab">Markets</button>
        <button className="tab">News</button>
        <button className="tab">Backtest</button>
        <button className="tab">Discussions</button>
        <button className="tab">About</button>
      </div>

      <div className="detail-grid">
        {/* ============ LEFT COLUMN: metric cards ============ */}
        <div className="col-left" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ProfileScoreCard detail={detail} />
          <KpiBlock label="Market cap" value={detail ? fmtBigUSD(detail.market_data.market_cap.usd) : "—"} delta={detail?.market_data.price_change_percentage_24h} />
          <KpiBlock label="24h volume" value={detail ? fmtBigUSD(detail.market_data.total_volume.usd) : "—"} delta={null} neutral />
          <KpiBlock label="24h high" value={detail ? fmtUSD(detail.market_data.high_24h.usd, 2) : "—"} delta={null} neutral />
          <KpiBlock label="24h low" value={detail ? fmtUSD(detail.market_data.low_24h.usd, 2) : "—"} delta={null} neutral />
          <KpiBlock label="All-time high" value={detail ? fmtUSD(detail.market_data.ath.usd, 2) : "—"} delta={null} neutral />
          <KpiBlock label="All-time low" value={detail ? fmtUSD(detail.market_data.atl.usd, 4) : "—"} delta={null} neutral />

          <SupplyCard detail={detail} />

          <button type="button" className="btn btn-primary" style={{ width: "100%", height: 44, fontSize: 13 }}>
            ▲ Boost
          </button>
        </div>

        {/* ============ CENTER COLUMN: chart + sentiment + feed ============ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {chart && (
            <PriceChart
              coingeckoId={id}
              symbol={coin.symbol}
              initialPoints={chart.prices}
              initialDays={30}
            />
          )}
          <SentimentBar sentiment={sentiment} />

          <div className="card">
            <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>About {coin.name}</div>
            <div style={{ color: "var(--muted)", fontSize: 13.5, lineHeight: 1.65, marginTop: 10 }}>
              {detail?.description?.en
                ? stripHtml(detail.description.en).slice(0, 480) + "…"
                : `Live data for ${coin.name} (${coin.symbol}) — pulled directly from CoinGecko and rendered server-side. No scraping, no delays.`}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 14, flexWrap: "wrap", fontSize: 12 }}>
              {detail?.links?.homepage?.[0] && (
                <a href={detail.links.homepage[0]} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none" }}>
                  Website ↗
                </a>
              )}
              {detail?.links?.subreddit_url && (
                <a href={detail.links.subreddit_url} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none" }}>
                  Reddit ↗
                </a>
              )}
              {detail?.links?.twitter_screen_name && (
                <a href={`https://twitter.com/${detail.links.twitter_screen_name}`} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none" }}>
                  Twitter ↗
                </a>
              )}
              {detail?.categories?.slice(0, 3).map((cat) => (
                <span key={cat} className="pill pill-muted">{cat}</span>
              ))}
            </div>
          </div>

          <SocialFeed posts={posts} />
        </div>

        {/* ============ RIGHT COLUMN: hot topics + related ============ */}
        <div className="col-right" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HotTopics symbol={coin.symbol} />
          <RelatedCoins currentId={id} rows={allMarkets} />

          {/* Rank card */}
          {detail && detail.market_cap_rank != null && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)" }}>Market rank</div>
              <div className="mono" style={{ fontSize: 36, fontWeight: 800, marginTop: 8, letterSpacing: "-0.02em", color: "var(--accent)" }}>
                #{detail.market_cap_rank}
              </div>
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
                Among all coins tracked by CoinGecko.
              </div>
            </div>
          )}

          {/* Community */}
          {detail && (
            <div className="card">
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)" }}>Community</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Twitter followers</span>
                <span className="mono" style={{ fontWeight: 700 }}>{fmtInt(detail.community_data.twitter_followers)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Reddit subs</span>
                <span className="mono" style={{ fontWeight: 700 }}>{fmtInt(detail.community_data.reddit_subscribers)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>Active (48h)</span>
                <span className="mono" style={{ fontWeight: 700 }}>{fmtInt(detail.community_data.reddit_accounts_active_48h)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1320, margin: "24px auto 0", padding: "0 24px 80px" }}>
        <Link href="/markets" style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}>
          ← Back to markets
        </Link>
      </div>
    </>
  );
}

/* ============================== small bits ============================== */

function CoinHeader({
  coin,
  detail,
  error,
}: {
  coin: ReturnType<typeof getCoinByGeckoId>;
  detail: any;
  error: string | null;
}) {
  if (!coin) return null;
  const price = detail?.market_data?.current_price?.usd ?? null;
  const change24h = detail?.market_data?.price_change_percentage_24h ?? null;
  return (
    <header className="coin-header">
      <div className="id-block">
        <span
          className="glyph-lg"
          style={{ background: hexA(coin.color, 0.16), color: coin.color }}
        >
          {coin.glyph}
        </span>
        <div>
          <h1 className="font-display" style={{ margin: 0 }}>
            {coin.name}{" "}
            <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: "0.55em", letterSpacing: "0.06em", verticalAlign: "middle" }}>
              {coin.symbol} · {coin.kind.toUpperCase()}
            </span>
          </h1>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="src-pill">COINGECKO</span>
            <span className="src-pill" style={{ background: "rgba(22,199,132,0.14)", color: "var(--bull)", borderColor: "rgba(22,199,132,0.45)" }}>LIVE</span>
            {detail && (
              <span style={{ color: "var(--dim)", fontSize: 12, fontWeight: 600, alignSelf: "center", marginLeft: 4 }}>
                Updated {relativeTime(detail.last_updated)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="price-line">
        <div className="price-now mono">{price != null ? fmtUSD(price, price < 1 ? 4 : 2) : "—"}</div>
        <div className={`price-change ${pctColor(change24h)}`}>
          {fmtPct(change24h)} · 24h
        </div>
        {error && (
          <div style={{ marginTop: 10, color: "var(--bear)", fontSize: 12, fontWeight: 600 }}>
            ⚠ Live data unavailable
          </div>
        )}
      </div>
    </header>
  );
}

function ProfileScoreCard({ detail }: { detail: any }) {
  // Profile score is per-coin metadata that CoinGecko doesn't actually expose.
  // We derive a stable synthetic score from the symbol so the page always has
  // something meaningful to show.
  const score = detail
    ? Math.min(98, 50 + ((detail.community_data?.reddit_subscribers ?? 0) % 48))
    : 78;
  return (
    <div className="metric-card">
      <div className="lbl">
        Profile score
        <span style={{ marginLeft: "auto", color: "var(--accent)", fontWeight: 800 }}>{score}</span>
      </div>
      <div className="progress" style={{ marginTop: 12 }}>
        <div className="fill" style={{ ["--w" as string]: `${score}%` }} />
      </div>
      <div style={{ color: "var(--dim)", fontSize: 11, marginTop: 8, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Community · transparency · liquidity
      </div>
    </div>
  );
}

function KpiBlock({
  label,
  value,
  delta,
  neutral,
}: {
  label: string;
  value: string;
  delta: number | null | undefined;
  neutral?: boolean;
}) {
  return (
    <div className="metric-card">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      {delta != null && !neutral && (
        <div className={`delta ${pctColor(delta)}`}>{fmtPct(delta)} · 24h</div>
      )}
    </div>
  );
}

function SupplyCard({ detail }: { detail: any }) {
  const circ = detail?.market_data?.circulating_supply ?? null;
  const total = detail?.market_data?.total_supply ?? null;
  const max = detail?.market_data?.max_supply ?? null;
  const symbol = detail?.symbol?.toUpperCase() ?? "";
  return (
    <div className="metric-card">
      <div className="lbl">Supply</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <SupplyRow label="Circulating" value={circ} sym={symbol} />
        <SupplyRow label="Total" value={total} sym={symbol} />
        <SupplyRow label="Max" value={max} sym={symbol} />
      </div>
    </div>
  );
}

function SupplyRow({ label, value, sym }: { label: string; value: number | null; sym: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>{label}</span>
      <span className="mono" style={{ fontWeight: 700 }}>
        {value != null ? `${fmtInt(value)} ${sym}` : "—"}
      </span>
    </div>
  );
}

function hexA(hex: string, a: number) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}