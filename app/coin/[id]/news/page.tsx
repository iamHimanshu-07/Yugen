/**
 * /coin/[id]/news — News feed filtered to this coin.
 *
 * Server component. Calls fetchNewsForCurrencies([symbol]) to pre-fetch the
 * initial list, then hands off to NewsFeed for client-side pagination. The
 * component already supports a `currencies` filter — we just pass [symbol].
 */
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchCoinDetail } from "@/lib/coingecko";
import { fetchNewsForCurrencies } from "@/lib/news";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { NewsFeed } from "@/components/news/news-feed";
import { NewsRefreshButton } from "@/components/news/news-refresh-button";
import { CoinHeader } from "@/components/coin-detail/coin-header";
import { TabStrip } from "@/components/coin-detail/tab-strip";

export const revalidate = 300;

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) return {};
  return {
    title: `${coin.name} news — ${coin.symbol} coverage · Yugen`,
    description: `Latest news about ${coin.name}, filtered from CryptoPanic and major crypto RSS feeds.`,
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) notFound();

  let detail: any = null;
  let initialItems: Awaited<ReturnType<typeof fetchNewsForCurrencies>> = [];
  let loadError: string | null = null;

  try {
    [detail, initialItems] = await Promise.all([
      fetchCoinDetail(id),
      fetchNewsForCurrencies([coin.symbol], 15),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load news";
  }

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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h2
              className="h-section"
              style={{ fontSize: 24, margin: 0 }}
            >
              {coin.name} news
            </h2>
            <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>
              Filtered to {coin.symbol} · CryptoPanic + RSS feeds
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NewsRefreshButton />
            <Link
              href="/news"
              style={{ color: "var(--muted)", fontSize: 13, textDecoration: "none" }}
            >
              All news →
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="card" style={{ borderColor: "var(--bear)" }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>
              Could not load news
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{loadError}</div>
          </div>
        ) : (
          <NewsFeed
            initialItems={initialItems as any}
            currencies={[coin.symbol]}
            limit={15}
          />
        )}
      </div>
    </>
  );
}