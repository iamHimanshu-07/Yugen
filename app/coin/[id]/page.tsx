/**
 * Coin detail page (/coin/[id]) — the Chart view, kept short.
 *
 * Single-column layout: header → chart → KPI strip (4) → sentiment + supply
 * side-by-side → short social feed (4 posts). All extra content moved to
 * sub-pages under /coin/[id]/{markets,news,discussions,about}.
 */
import { notFound } from "next/navigation";
import {
  fetchCoinDetail,
  fetchMarketChart,
  type CoinDetail,
  type MarketChart,
} from "@/lib/coingecko";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { mockSentiment } from "@/lib/sentiment";
import { fetchSocialPosts } from "@/lib/reddit";
import { fmtUSD, fmtBigUSD, fmtPct, fmtInt, pctColor } from "@/lib/utils";
import { PriceChart } from "@/components/coin-detail/price-chart";
import { SentimentBar } from "@/components/coin-detail/sentiment-bar";
import { ShortFeed } from "@/components/coin-detail/short-feed";
import { CoinHeader } from "@/components/coin-detail/coin-header";
import { TabStrip } from "@/components/coin-detail/tab-strip";

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

  let detail: CoinDetail | null = null;
  let chart: MarketChart | null = null;
  let posts: Awaited<ReturnType<typeof fetchSocialPosts>> = [];
  let loadError: string | null = null;

  try {
    [detail, chart, posts] = await Promise.all([
      fetchCoinDetail(id),
      fetchMarketChart(id, 30),
      fetchSocialPosts(coin.symbol, 8),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load coin data";
  }

  const sentiment = mockSentiment(coin.symbol);
  const usingMock = posts[0]?.source === "mock";

  return (
    <>
      <CoinHeader coin={coin} detail={detail} error={loadError} />
      <TabStrip basePath={`/coin/${id}`} />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Chart */}
        {chart && (
          <PriceChart
            coingeckoId={id}
            symbol={coin.symbol}
            initialPoints={chart.prices}
            initialDays={30}
          />
        )}

        {/* Enhanced 4-KPI strip with more data points */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
          }}
          className="md:grid-cols-2 sm:grid-cols-1"
        >
          <KpiBlock
            label="Market cap"
            value={detail ? fmtBigUSD(detail.market_data.market_cap.usd) : "—"}
            delta={detail?.market_data.price_change_percentage_24h}
          />
          <KpiBlock
            label="24h volume"
            value={detail ? fmtBigUSD(detail.market_data.total_volume.usd) : "—"}
            neutral
          />
          <KpiBlock
            label="All-time high"
            value={detail ? fmtUSD(detail.market_data.ath.usd, 2) : "—"}
            neutral
          />
          <KpiBlock
            label="All-time low"
            value={detail ? fmtUSD(detail.market_data.atl.usd, 2) : "—"}
            neutral
          />
        </div>

        {/* Sentiment + Supply, side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 16,
          }}
          className="md:grid-cols-1"
        >
          <SentimentBar sentiment={sentiment} />
          <SupplyCard detail={detail} symbol={detail?.symbol?.toUpperCase() ?? coin.symbol} />
        </div>

        {/* Short social feed */}
        <ShortFeed posts={posts} coinId={id} usingMock={usingMock} />
      </div>
    </>
  );
}

/* ============================== small bits ============================== */

function KpiBlock({
  label,
  value,
  delta,
  neutral,
}: {
  label: string;
  value: string;
  delta?: number | null | undefined;
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

function SupplyCard({ detail, symbol }: { detail: any; symbol: string }) {
  const circ = detail?.market_data?.circulating_supply ?? null;
  const total = detail?.market_data?.total_supply ?? null;
  const max = detail?.market_data?.max_supply ?? null;

  // Calculate supply ratios
  const circulatingRatio = total && circ ? ((circ / total) * 100) : null;
  const maxRatio = max && circ ? ((circ / max) * 100) : null;

  return (
    <div className="metric-card">
      <div className="lbl">Supply</div>
      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <SupplyRow label="Circulating" value={circ} sym={symbol} />
        {total !== null && (
          <>
            <SupplyRow label="Total" value={total} sym={symbol} />
            {circulatingRatio !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: -4 }}>
                {circulatingRatio.toFixed(1)}% of total
              </div>
            )}
          </>
        )}
        {max !== null && (
          <>
            <SupplyRow label="Max" value={max} sym={symbol} />
            {maxRatio !== null && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: -4 }}>
                {maxRatio.toFixed(1)}% of max
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SupplyRow({ label, value, sym }: { label: string; value: number | null; sym: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
      }}
    >
      <span style={{ color: "var(--muted)", fontWeight: 600 }}>{label}</span>
      <span className="mono" style={{ fontWeight: 700 }}>
        {value != null ? `${fmtInt(value)} ${sym}` : "—"}
      </span>
    </div>
  );
}