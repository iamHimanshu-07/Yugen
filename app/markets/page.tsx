/**
 * Markets index — the 14-coin catalog grid.
 * Server Component. Pulls live data from CoinGecko, filtered to catalog coins.
 * Sort + filter is client-side (the result set is only 14 rows).
 */
import Link from "next/link";
import { fetchCatalogMarkets } from "@/lib/coingecko";
import { listCoins, getCoin } from "@/lib/coins";
import { fmtBigUSD, fmtPct, fmtUSD, pctColor, relativeTime } from "@/lib/utils";
import { CatalogGrid } from "@/components/market/catalog-grid";

export const revalidate = 60;

export const metadata = {
  title: "Markets — Yugen",
  description: "The 14 coins that actually matter. Live market data including rank, price, changes, volume and supply.",
};

export default async function MarketsPage() {
  let rows: Awaited<ReturnType<typeof fetchCatalogMarkets>> = [];
  let loadError: string | null = null;
  try {
    rows = await fetchCatalogMarkets();
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load markets";
  }

  // Map CoinGecko rows onto our catalog (drop anything not in COINS).
  const catalog = listCoins();
  const items = catalog.map((coin) => {
    const cg = rows.find((r) => r.id === coin.coingeckoId);
    return {
      symbol: coin.symbol,
      name: coin.name,
      glyph: coin.glyph,
      color: coin.color,
      coingeckoId: coin.coingeckoId,
      kind: coin.kind,
      price: cg?.current_price ?? null,
      change24h: cg?.price_change_percentage_24h ?? null,
      marketCap: cg?.market_cap ?? null,
      volume24h: cg?.total_volume ?? null,
      marketCapRank: cg?.market_cap_rank ?? null,
      high24h: cg?.high_24h ?? null,
      low24h: cg?.low_24h ?? null,
      priceChangePercentage7d: cg?.price_change_percentage_7d ?? null,
      priceChangePercentage30d: cg?.price_change_percentage_30d ?? null,
      priceChangePercentage1y: cg?.price_change_percentage_1y ?? null,
      circulatingSupply: cg?.circulating_supply ?? null,
      sparkline: cg?.sparkline_in_7d?.price ?? [],
      lastUpdated: cg?.last_updated ?? null,
    };
  });

  const totalCap = items.reduce((s, r) => s + (r.marketCap ?? 0), 0);
  const totalVol = items.reduce((s, r) => s + (r.volume24h ?? 0), 0);

  return (
    <>
      <header className="section-tight" style={{ paddingTop: 56, paddingBottom: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Markets</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 className="h-section" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
              {items.length} coins. Live. <span style={{ color: "var(--muted)", fontWeight: 700 }}>Click any to open the full dashboard.</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24, color: "var(--muted)", fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Combined cap</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{fmtBigUSD(totalCap)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>24h volume</div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--text)" }}>{fmtBigUSD(totalVol)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Source</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--accent)" }}>CoinGecko</div>
            </div>
          </div>
        </div>
      </header>

      <div className="section-tight" style={{ paddingTop: 32 }}>
        {loadError ? (
          <div className="card" style={{ borderColor: "var(--bear)" }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>Could not reach CoinGecko</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{loadError}</div>
            <div style={{ color: "var(--dim)", fontSize: 13, marginTop: 8 }}>
              The catalog is showing — only the live prices are missing. Try again in a minute.
            </div>
          </div>
        ) : (
          <CatalogGrid items={items} />
        )}
      </div>

      <section className="section-tight" style={{ paddingTop: 8 }}>
        <div style={{ color: "var(--dim)", fontSize: 12, lineHeight: 1.6 }}>
          Prices refresh every ~60 seconds from CoinGecko. Two coins considered for the catalog
          (HYPE, LEO) are excluded — they don't load on the free tier from this region.
        </div>
      </section>
    </>
  );
}