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

const BASE = "https://api.coingecko.com/api/v3";
const REVALIDATE_SECONDS = 60;

// ---------- tiny in-memory LRU to back off from CoinGecko rate limits -------

type Entry<T> = { value: T; expiresAt: number };
const CACHE = new Map<string, Entry<unknown>>();

async function cachedFetch<T>(url: string, ttlSeconds = REVALIDATE_SECONDS): Promise<T> {
  const cached = CACHE.get(url) as Entry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }
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
  return cachedFetch<CoinDetail>(url, 60);
}

/**
 * Fetch global cryptocurrency data (market cap, volumes, dominance).
 */
export async function fetchGlobal(): Promise<GlobalData> {
  const url = `${BASE}/global`;
  return cachedFetch<GlobalData>(url, 60);
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
  return cachedFetch<MarketChart>(url);
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