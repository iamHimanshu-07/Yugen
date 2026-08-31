/**
 * exchange.ts — server-side fetchers for professional trading signals.
 *
 *- Funding Rates: Binance Futures API (Market Bias)
 *- Liquidity Depth: DexScreener API (Exit Signal)
 *
 * All APIs used are free and require no authentication.
 */

import { hashString } from "./utils";
import { listCoins } from "./coins";

const BINANCE_FUTURES_BASE = "https://fapi.binance.com";
const DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex";

/**
 * Check if we're running in a local development environment.
 */
function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== "production";
}

// ---------- Funding Rates (Binance) ----------

export interface FundingRate {
  symbol: string;
  lastFundingRate: number;
  nextFundingTime: number;
}

/**
 * Fetch the current funding rate for a coin.
 * Funding rate is a proxy for Market Bias:
 *   Positive (+) -> Longs pay Shorts -> Market is bullish/overheated
 *   Negative (-) -> Shorts pay Longs -> Market is bearish/oversold
 */
export async function fetchFundingRate(symbol: string): Promise<FundingRate | null> {
  if (isLocalDev()) {
    const seed = hashString(symbol);
    return {
      symbol: symbol.toUpperCase(),
      lastFundingRate: ((seed % 100) - 50) / 10000, // Mock -0.005 to +0.005
      nextFundingTime: Date.now() + 3600000,
    };
  }

  try {
    // Binance Futures uses symbols like BTCUSDT
    const symbolUpper = symbol.toUpperCase() + "USDT";
    const res = await fetch(`${BINANCE_FUTURES_BASE}/fapi/v1/premiumIndex?symbol=${symbolUpper}`);

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || typeof data !== "object") return null;

    return {
      symbol: data.symbol,
      lastFundingRate: parseFloat(data.lastFundingRate),
      nextFundingTime: data.nextFundingTime,
    };
  } catch (e) {
    console.warn(`[exchange] Funding rate fetch failed for ${symbol}:`, e);
    return null;
  }
}

// ---------- Liquidity Depth (DexScreener) ----------

export interface LiquidityDepth {
  usdLiquidity: number | null;
  topPair: string | null;
  volume24h: number | null;
}

/**
 * Fetch liquidity depth from DexScreener.
 * Liquidity is the "Exit Signal" — tells us if a price move is backed by real capital.
 */
export async function fetchDexLiquidity(symbol: string): Promise<LiquidityDepth | null> {
  if (isLocalDev()) {
    const seed = hashString(symbol);
    return {
      usdLiquidity: (seed % 1000000) * 1000, // Mock $0 to $10M
      topPair: `${symbol.toUpperCase()}/USDC`,
      volume24h: (seed % 500000) * 100,
    };
  }

  try {
    // Use search API to find the most liquid pair for the symbol
    const res = await fetch(`${DEXSCREENER_BASE}/search?q=${symbol.toUpperCase()}`);

    if (!res.ok) return null;

    const data = await res.json();
    const pairs = data.pairs;
    if (!pairs || pairs.length === 0) return null;

    // The first pair in the search result is usually the most liquid/relevant
    const topPair = pairs[0];

    return {
      usdLiquidity: topPair.liquidity ? topPair.liquidity.usd : null,
      topPair: topPair.pair,
      volume24h: topPair.volume ? topPair.volume.h24 : null,
    };
  } catch (e) {
    console.warn(`[exchange] Dex liquidity fetch failed for ${symbol}:`, e);
    return null;
  }
}
