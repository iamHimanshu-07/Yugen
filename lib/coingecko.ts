/**
 * coingecko.ts — server-side fetchers for CoinGecko's free public API.
 *
 * No API key needed for the endpoints we use. Free tier rate limit is
 * 10-30 req/min; we keep an in-process LRU + 60s revalidate so we stay well
 * under it. All fetchers are safe to call from Server Components and
 * Route Handlers.
 *
 * Endpoints used:
 *   GET /coins/markets?vs_currency=usd
 *   GET /coins/{id}?localization=false&tickers=false&community_data=true
 *   GET /coins/{id}/market_chart?vs_currency=usd&days={1,7,30,90,365}
 *   GET /global
 */

import { listCoins, type Coin } from "./coins";
import { hashString } from "./utils";

const BASE = "https://api.coingecko.com/api/v3";
const REVALIDATE_SECONDS = 60;

// ---------- tiny in-memory LRU to back off from CoinGecko rate limits -------

type Entry<T> = { value: T; expiresAt: number };
const CACHE = new Map<string, Entry<unknown>>();

/**
 * Check if we're running in a local development environment.
 * In production (Vercel), this will be false and real API calls will be made.
 */
function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== "production";
}

/**
 * Generate deterministic mock market data for local development.
 * Uses hashString so the same coin always gets the same "random" values,
 * preventing flicker between renders.
 */
function generateMockMarketRow(coin: Coin): MarketRow {
  const seed = hashString(coin.coingeckoId);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][
    Object.values(COINS).findIndex((c) => c.coingeckoId === coin.coingeckoId)
  ] || 100;

  // Deterministic variations based on seed
  const price = priceBase * (0.8 + (seed % 40) / 100);
  const change24h = ((seed % 200) - 100) / 10; // -10% to +10%
  const marketCap = price * (1000000 + (seed % 50000000));
  const volume24h = marketCap * (0.01 + (seed % 500) / 10000);

  return {
    id: coin.coingeckoId,
    symbol: coin.symbol.toLowerCase(),
    name: coin.name,
    image: `https://assets.coingecko.com/coins/images/1/${coin.coingeckoId}.png`,
    current_price: price,
    market_cap: marketCap,
    market_cap_rank: Object.values(COINS).findIndex((c) => c.coingeckoId === coin.coingeckoId) + 1,
    fully_diluted_valuation: marketCap * 1.1,
    total_volume: volume24h,
    high_24h: price * 1.05,
    low_24h: price * 0.95,
    price_change_24h: price * (change24h / 100),
    price_change_percentage_24h: change24h,
    circulating_supply: marketCap / price,
    total_supply: marketCap / price * 1.1,
    max_supply: coin.symbol === "BTC" ? 21000000 : marketCap / price * 1.2,
    ath: price * 3,
    atl: price * 0.1,
    sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => price * (0.9 + (hashString(coin.coingeckoId + i.toString()) % 200) / 1000)) },
    last_updated: new Date().toISOString(),
  };
}

// Reference COINS for mock generation
const COINS = {
  bitcoin: { symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin" },
  ethereum: { symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum" },
  binancecoin: { symbol: "BNB", name: "BNB", coingeckoId: "binancecoin" },
  solana: { symbol: "SOL", name: "Solana", coingeckoId: "solana" },
  ripple: { symbol: "XRP", name: "XRP", coingeckoId: "ripple" },
  cardano: { symbol: "ADA", name: "Cardano", coingeckoId: "cardano" },
  tron: { symbol: "TRX", name: "TRON", coingeckoId: "tron" },
  chainlink: { symbol: "LINK", name: "Chainlink", coingeckoId: "chainlink" },
  stellar: { symbol: "XLM", name: "Stellar", coingeckoId: "stellar" },
  zcash: { symbol: "ZEC", name: "Zcash", coingeckoId: "zcash" },
  monero: { symbol: "XMR", name: "Monero", coingeckoId: "monero" },
  dogecoin: { symbol: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin" },
  tether: { symbol: "USDT", name: "Tether", coingeckoId: "tether" },
  "usd-coin": { symbol: "USDC", name: "USD Coin", coingeckoId: "usd-coin" },
} as Record<string, Coin>;

async function cachedFetch<T>(url: string, ttlSeconds = REVALIDATE_SECONDS): Promise<T> {
  const cached = CACHE.get(url) as Entry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        // CoinGecko asks for a UA on some routes; harmless.
        "User-Agent": "crypto-dashboard/1.0",
      },
      next: { revalidate: ttlSeconds },
    });

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}: ${res.statusText} (${url})`);
    }

    const data = (await res.json()) as T;
    CACHE.set(url, { value: data, expiresAt: Date.now() + ttlSeconds * 1000 });
    // Bound the cache
    if (CACHE.size > 200) {
      const oldestKey = CACHE.keys().next().value;
      if (oldestKey) CACHE.delete(oldestKey);
    }
    return data;
  } catch (error) {
    // If we're in local dev and the fetch fails (SSL, network, rate limit),
    // return mock data instead of throwing
    if (isLocalDev() && url.includes("/coins/markets")) {
      console.warn("[coingecko] API fetch failed in local dev, using mock data:", error instanceof Error ? error.message : String(error));
      const coins = listCoins();
      const mockData = coins.map((c) => generateMockMarketRow(c)) as T;
      return mockData;
    }
    throw error;
  }
}

// ---------- shapes (only what we actually use) -------------------------------

export interface MarketRow {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_24h: number | null;
  price_change_percentage_24h: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  max_supply: number | null;
  ath: number | null;
  atl: number | null;
  sparkline_in_7d: { price: number[] } | null;
  last_updated: string | null;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: { en: string | null };
  image: { small: string; large: string };
  market_cap_rank: number | null;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    fully_diluted_valuation: { usd: number | null };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    price_change_percentage_1y: number;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
    ath: { usd: number };
    atl: { usd: number };
    sparkline_7d: { price: number[] };
  };
  community_data: {
    twitter_followers: number | null;
    reddit_subscribers: number | null;
    reddit_accounts_active_48h: number | null;
  };
  developer_data: {
    stars: number | null;
    forks: number | null;
  };
  links: {
    homepage: string[];
    subreddit_url: string | null;
    twitter_screen_name: string | null;
    repos_url: { github: string[] };
  };
  categories: string[];
  last_updated: string;
}

export interface MarketChart {
  prices: [number, number][];           // [ms, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// Global data shape
export interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: { usd: number; btc: number; eth: number };
    total_volume: { usd: number; btc: number; eth: number };
    market_cap_percentage: { usd: number; btc: number; eth: number };
    // The market_cap_percentage object contains the dominance of each coin.
    // For Bitcoin dominance, we need market_cap_percentage.btc
  };
}

// ---------- public API ------------------------------------------------------

/**
 * Fetch all 14 catalog coins' market data from CoinGecko.
 * Uses `ids=` to scope the request to only catalog coins — keeps response
 * small and avoids scraping the global top-100.
 */
export async function fetchCatalogMarkets(vsCurrency = "usd"): Promise<MarketRow[]> {
  const ids = listCoins()
    .map((c: Coin) => c.coingeckoId)
    .join(",");
  const url = `${BASE}/coins/markets?vs_currency=${vsCurrency}&ids=${ids}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`;
  return cachedFetch<MarketRow[]>(url);
}

/**
 * Fetch one coin's full detail object.
 */
export async function fetchCoinDetail(id: string): Promise<CoinDetail> {
  const url = `${BASE}/coins/${id}?localization=false&tickers=false&community_data=true&developer_data=true&sparkline=true`;
  try {
    return await cachedFetch<CoinDetail>(url, 60);
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[coingecko] fetchCoinDetail failed for ${id}, using mock:`, error instanceof Error ? error.message : String(error));
      return generateMockCoinDetail(id);
    }
    throw error;
  }
}

/**
 * Fetch global cryptocurrency data (market cap, volumes, dominance).
 */
export async function fetchGlobal(): Promise<GlobalData> {
  const url = `${BASE}/global`;
  try {
    return await cachedFetch<GlobalData>(url, 60);
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[coingecko] fetchGlobal failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockGlobal();
    }
    throw error;
  }
}

/**
 * Fetch market chart for a coin over `days` days. CoinGecko automatically
 * down-samples to a sensible granularity for the range:
 *   1     -> ~5min candles
 *   7-30  -> hourly
 *   30-365-> daily
 */
export async function fetchMarketChart(id: string, days: number): Promise<MarketChart> {
  const url = `${BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
  try {
    return await cachedFetch<MarketChart>(url);
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[coingecko] fetchMarketChart failed for ${id} (${days}d), using mock:`, error instanceof Error ? error.message : String(error));
      return generateMockMarketChart(id, days);
    }
    throw error;
  }
}

/**
 * Map CoinGecko days param → human label for the chart range tabs.
 */
export const CHART_RANGES: { label: string; days: number; key: string }[] = [
  { label: "1H",  days: 1,   key: "1h"  },  // CoinGecko doesn't have 1h; we re-slice
  { label: "24H", days: 1,   key: "1d"  },
  { label: "1W",  days: 7,   key: "7d"  },
  { label: "1M",  days: 30,  key: "30d" },
  { label: "1Y",  days: 365, key: "1y"  },
];

// ---------- Local Development Mocks ------------------------------------------

/**
 * Generate deterministic mock coin detail for local development.
 */
function generateMockCoinDetail(id: string): CoinDetail {
  const coin = getCoinByGeckoId(id);
  if (!coin) throw new Error(`Unknown coin: ${id}`);
  const seed = hashString(id);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][
    Object.values(COINS).findIndex((c) => c.coingeckoId === id)
  ] || 100;
  const price = priceBase * (0.8 + (seed % 40) / 100);
  const marketCap = price * (1000000 + (seed % 50000000));
  const change24h = ((seed % 200) - 100) / 10;

  return {
    id: coin.coingeckoId,
    symbol: coin.symbol,
    name: coin.name,
    description: { en: `${coin.name} is a cryptocurrency.` },
    image: { small: `https://assets.coingecko.com/coins/images/1/small/${coin.coingeckoId}.png`, large: `https://assets.coingecko.com/coins/images/1/large/${coin.coingeckoId}.png` },
    market_cap_rank: Object.values(COINS).findIndex((c) => c.coingeckoId === id) + 1,
    market_data: {
      current_price: { usd: price },
      market_cap: { usd: marketCap },
      fully_diluted_valuation: { usd: marketCap * 1.1 },
      total_volume: { usd: marketCap * 0.05 },
      high_24h: { usd: price * 1.05 },
      low_24h: { usd: price * 0.95 },
      price_change_24h: price * (change24h / 100),
      price_change_percentage_24h: change24h,
      price_change_percentage_7d: ((seed % 300) - 150) / 10,
      price_change_percentage_30d: ((seed % 500) - 250) / 10,
      price_change_percentage_1y: ((seed % 1000) - 500) / 10,
      circulating_supply: marketCap / price,
      total_supply: marketCap / price * 1.1,
      max_supply: coin.symbol === "BTC" ? 21000000 : marketCap / price * 1.2,
      ath: { usd: price * 3 },
      atl: { usd: price * 0.1 },
      sparkline_7d: { price: Array.from({ length: 168 }, (_, i) => price * (0.9 + (hashString(id + i.toString()) % 200) / 1000)) },
    },
    community_data: {
      twitter_followers: 1000000 + (seed % 5000000),
      reddit_subscribers: 100000 + (seed % 500000),
      reddit_accounts_active_48h: 1000 + (seed % 10000),
    },
    developer_data: { stars: 5000 + (seed % 20000), forks: 1000 + (seed % 5000) },
    links: {
      homepage: [`https://${coin.coingeckoId}.org`],
      subreddit_url: `https://reddit.com/r/${coin.coingeckoId}`,
      twitter_screen_name: coin.coingeckoId,
      repos_url: { github: [`https://github.com/${coin.coingeckoId}`] },
    },
    categories: ["Layer 1", "Smart Contracts"],
    last_updated: new Date().toISOString(),
  };
}

/**
 * Generate deterministic mock global data for local development.
 */
function generateMockGlobal(): GlobalData {
  return {
    data: {
      active_cryptocurrencies: 10000,
      upcoming_icos: 0,
      ongoing_icos: 0,
      ended_icos: 0,
      markets: 500,
      total_market_cap: { usd: 2.5e12, btc: 45000000, eth: 700000000 },
      total_volume: { usd: 1e11, btc: 1800000, eth: 28000000 },
      market_cap_percentage: { usd: 100, btc: 52.3, eth: 18.7 },
    },
  };
}

/**
 * Generate deterministic mock market chart for local development.
 */
function generateMockMarketChart(id: string, days: number): MarketChart {
  const coin = getCoinByGeckoId(id);
  if (!coin) throw new Error(`Unknown coin: ${id}`);
  const seed = hashString(id);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][
    Object.values(COINS).findIndex((c) => c.coingeckoId === id)
  ] || 100;
  const price = priceBase * (0.8 + (seed % 40) / 100);

  // Granularity: 1d -> ~5min (288 points), 7d -> hourly (168), 30d+ -> daily
  let points: number;
  let intervalMs: number;
  if (days <= 1) {
    points = 288;
    intervalMs = 5 * 60 * 1000;
  } else if (days <= 30) {
    points = 24 * days;
    intervalMs = 60 * 60 * 1000;
  } else {
    points = days;
    intervalMs = 24 * 60 * 60 * 1000;
  }

  const now = Date.now();
  const prices: [number, number][] = [];
  const market_caps: [number, number][] = [];
  const total_volumes: [number, number][] = [];

  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * intervalMs;
    const variation = 0.9 + (hashString(id + i.toString()) % 200) / 1000;
    const p = price * variation;
    const mc = p * (1000000 + (seed % 50000000));
    const vol = mc * 0.05;
    prices.push([t, p]);
    market_caps.push([t, mc]);
    total_volumes.push([t, vol]);
  }

  return { prices, market_caps, total_volumes };
}