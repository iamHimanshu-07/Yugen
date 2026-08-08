/**
 * /coin/[id]/markets — Related coins + market rank card.
 *
 * Server component. Mirrors the header + tab strip from the main coin page.
 * All extra market context (related coins, market rank) lives here so the
 * main /coin/[id] chart view can stay focused.
 */
import { notFound } from "next/navigation";
import { fetchCoinDetail, fetchCatalogMarkets } from "@/lib/coingecko";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { fmtInt } from "@/lib/utils";
import { RelatedCoins } from "@/components/coin-detail/related-coins";
import { CoinHeader } from "@/components/coin-detail/coin-header";
import { TabStrip } from "@/components/coin-detail/tab-strip";
import Link from "next/link";

export const revalidate = 60;

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) return {};
  return {
    title: `${coin.name} markets — related coins & rank · Yugen`,
    description: `${coin.name} market rank, related coins in the catalog, and what else is moving in the same lane.`,
  };
}

export default async function MarketsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) notFound();

  let detail: any = null;
  let allMarkets: Awaited<ReturnType<typeof fetchCatalogMarkets>> = [];
  let loadError: string | null = null;

  try {
    [detail, allMarkets] = await Promise.all([
      fetchCoinDetail(id),
      fetchCatalogMarkets(),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load markets";
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
        {/* Market rank */}
        {detail && detail.market_cap_rank != null && (
          <div className="card">
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "var(--muted)",
              }}
            >
              Market rank
            </div>
            <div
              className="mono"
              style={{
                fontSize: 36,
                fontWeight: 800,
                marginTop: 8,
                letterSpacing: "-0.02em",
                color: "var(--accent)",
              }}
            >
              #{detail.market_cap_rank}
            </div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
              Among all coins tracked by CoinGecko.
            </div>
            {detail.market_data?.market_cap?.usd != null && (
              <div style={{ marginTop: 14, color: "var(--muted)", fontSize: 13 }}>
                Market cap:{" "}
                <span className="mono" style={{ color: "var(--text)", fontWeight: 700 }}>
                  ${fmtInt(detail.market_data.market_cap.usd)} {coin.symbol}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Related coins */}
        <RelatedCoins currentId={id} rows={allMarkets} />

        <div style={{ color: "var(--dim)", fontSize: 12 }}>
          <Link
            href="/markets"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Browse the full 14-coin catalog →
          </Link>
        </div>
      </div>
    </>
  );
}