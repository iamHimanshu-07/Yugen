/**
 * Per-coin OpenGraph image. Auto-served at /coin/[id]/opengraph-image.png.
 * Uses Satori — only flexbox + solid colors. Every multi-child div must
 * declare display:flex.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { fetchCatalogMarkets } from "@/lib/coingecko";

export const runtime = "nodejs";
export const alt = "Yugen — live coin data";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Bundle Noto Sans Symbols 2 so Satori can render every coin glyph (₿ Ξ ◎ ◬
 * ⛓ ✕ etc.) without falling back to Google Fonts at build time. See
 * /app/opengraph-image.tsx for the long-form explanation.
 */
async function loadSymbolsFont(): Promise<Buffer> {
  const path = join(process.cwd(), "app", "fonts", "NotoSansSymbols2-Regular.ttf");
  return readFile(path);
}

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export default async function CoinOG({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  const symbols = await loadSymbolsFont();
  const fonts = [
    { name: "Symbols", data: symbols, weight: 400 as const, style: "normal" as const },
  ];
  if (!coin) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "#0A0B0F",
            color: "#F5F7FA",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            fontWeight: 800,
          }}
        >
          Coin not in catalog
        </div>
      ),
      { ...size, fonts },
    );
  }

  // Live prices are best-effort. We never fail the OG build over them:
  // the static coin metadata (name, symbol, glyph, color) already makes the
  // card distinctive, and missing prices just render as "$—".
  let price: number | null = null;
  let change24h: number | null = null;
  try {
    const rows = await fetchCatalogMarkets();
    const row = rows.find((r) => r.id === coin.coingeckoId);
    price = row?.current_price ?? null;
    change24h = row?.price_change_percentage_24h ?? null;
  } catch {
    // CoinGecko unreachable (build sandbox, network blip, rate limit).
    // Render without live numbers — better than a failed build.
  }

  const isUp = (change24h ?? 0) >= 0;
  const trendColor = isUp ? "#16C784" : "#EA3943";
  const fmtPrice =
    price != null
      ? price < 1
        ? `$${price.toFixed(4)}`
        : `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "$—";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0A0B0F",
          fontFamily: "sans-serif",
          color: "#F5F7FA",
        }}
      >
        {/* TOP ROW: wordmark + LIVE pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: coin.color,
              color: "#0A0B0F",
              fontSize: 32,
              fontWeight: 800,
              fontFamily: "Symbols",
            }}
          >
            {coin.glyph}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -2, display: "flex" }}>Yugen</div>
          <div
            style={{
              marginLeft: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 999,
              border: "1px solid #16C784",
              color: "#16C784",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: "#16C7841A",
              display: "flex",
              alignItems: "center",
            }}
          >
            ● Live
          </div>
        </div>

        {/* MIDDLE: coin meta */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#8A93A6",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            {coin.symbol} · {coin.kind.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              color: "#F5F7FA",
              marginTop: 14,
              display: "flex",
            }}
          >
            {coin.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 18 }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 800,
                letterSpacing: -2,
                fontFamily: "monospace",
                display: "flex",
              }}
            >
              {fmtPrice}
            </div>
            {change24h != null && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 8,
                  paddingBottom: 8,
                  borderRadius: 10,
                  color: trendColor,
                  backgroundColor: isUp ? "#16C7841A" : "#EA39431A",
                  fontFamily: "monospace",
                  display: "flex",
                }}
              >
                {isUp ? "▲" : "▼"} {Math.abs(change24h).toFixed(2)}% · 24h
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 20,
            borderTop: "1px solid #FFFFFF1A",
            color: "#5C6479",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex" }}>Price · Supply · Sentiment · Social feed</div>
          <div style={{ color: "#FF6A1A", display: "flex" }}>
            yugen-crypto.vercel.app/coin/{coin.coingeckoId} →
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}