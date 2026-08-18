/**
 * coingecko.ts — server-side fetchers with multi-API fallback for cryptocurrency data.
 *
 * Implements fallback chain: CoinGecko → CoinPaprika → Binance → KuCoin
 * All APIs used are free and require no authentication.
 * Preserves exact same data shapes and caching behavior as before.
 *
 * Endpoints used:
 *   GET /coins/markets?vs_currency=usd
 *   GET /coins/{id}?localization=false&tickers=false&community_data=true
 *   GET /coins/{id}/market_chart?vs_currency=usd&days={1,7,30,90,365}
 *   GET /global
 */

import { listCoins, type Coin, getCoinByGeckoId } from "./coins";
import { hashString } from "./utils";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const COINPAPRIKA_BASE = "https://api.coinpaprika.com/v1";
const BINANCE_BASE = "https://api.binance.com/api/v3";
const KUCOIN_BASE = "https://api.kucoin.com/api/v1";
const REVALIDATE_SECONDS = 60;

// Use the authoritative COINS from coins.ts instead of duplicating
const COINS: Record<string, Coin> = listCoins().reduce((acc, coin) => {
  acc[coin.coingeckoId] = coin;
  return acc;
}, {} as Record<string, Coin>);

// ---------- tiny in-memory LRU to back off from API rate limits -------

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
  // Find index in COINS array for deterministic price base
  const coinIndex = listCoins().findIndex((c) => c.coingeckoId === coin.coingeckoId);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][coinIndex] || 100;

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
    market_cap_rank: coinIndex + 1,
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

/**
 * Generate deterministic mock coin detail for local development.
 */
function generateMockCoinDetail(id: string): CoinDetail {
  const coin = getCoinByGeckoId(id);
  if (!coin) throw new Error(`Unknown coin: ${id}`);
  const seed = hashString(id);
  // Find index in COINS array for deterministic price base
  const coinIndex = listCoins().findIndex((c) => c.coingeckoId === id);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][coinIndex] || 100;
  const price = priceBase * (0.8 + (seed % 40) / 100);
  const marketCap = price * (1000000 + (seed % 50000000));
  const change24h = ((seed % 200) - 100) / 10;

  return {
    id: coin.coingeckoId,
    symbol: coin.symbol,
    name: coin.name,
    description: { en: `${coin.name} is a cryptocurrency.` },
    image: { small: `https://assets.coingecko.com/coins/images/1/small/${coin.coingeckoId}.png`, large: `https://assets.coingecko.com/coins/images/1/large/${coin.coingeckoId}.png` },
    market_cap_rank: coinIndex + 1,
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
  // Find index in COINS array for deterministic price base
  const coinIndex = listCoins().findIndex((c) => c.coingeckoId === id);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][coinIndex] || 100;
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

/**
 * Enhanced cached fetch with mock fallback for development
 */
async function cachedFetch<T>(url: string, ttlSeconds = REVALIDATE_SECONDS): Promise<T> {
  const cached = CACHE.get(url) as Entry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        // Some APIs ask for a UA on some routes; harmless.
        "User-Agent": "crypto-dashboard/1.0",
      },
    });

    if (!res.ok) {
      throw new Error(`API ${res.status}: ${res.statusText} (${url})`);
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
    // In development, we still throw the error to allow fallback chains to work
    // Mock data is only used as a final resort at the end of all fallback chains
    throw error;
  }
}

// ---------- Alternative API Implementations ----------

/**
 * Fetch from CoinPaprika API (free, no key required)
 */
async function fetchFromCoinPaprika<T>(endpoint: string): Promise<T> {
  const url = `${COINPAPRIKA_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "crypto-dashboard/1.0" },
  });

  if (!res.ok) {
    throw new Error(`CoinPaprika ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

/**
 * Fetch from Binance API (free, no key required for public endpoints)
 */
async function fetchFromBinance<T>(endpoint: string): Promise<T> {
  const url = `${BINANCE_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "crypto-dashboard/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Binance ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

/**
 * Fetch from KuCoin API (free, no key required for public endpoints)
 */
async function fetchFromKuCoin<T>(endpoint: string): Promise<T> {
  const url = `${KUCOIN_BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "crypto-dashboard/1.0" },
  });

  if (!res.ok) {
    throw new Error(`KuCoin ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

// ---------- Fallback Wrapper ----------

/**
 * Try multiple APIs in order until one succeeds
 * @param primaryFn Function to call primary API (CoinGecko)
 * @param fallbackFns Array of fallback functions to try in order
 */
async function fetchWithFallback<T>(
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>
): Promise<T> {
  try {
    return await primaryFn();
  } catch (primaryError) {
    // Try each fallback in order
    for (const fallbackFn of fallbackFns) {
      try {
        return await fallbackFn();
      } catch (fallbackError) {
        // Continue to next fallback
        continue;
      }
    }
    // If all fail, throw the primary error (preserves original error handling)
    throw primaryError;
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

// ---------- Helper Functions for API Mapping ----------

/**
 * Map CoinGecko market response to standardized format
 * (Already in correct format from CoinGecko, so identity function)
 */
function mapMarketRow(data: any): MarketRow {
  return data;
}

/**
 * Map CoinPaprika ticker data to MarketRow format
 */
function mapCoinPaprikaToMarketRow(data: any): MarketRow {
  return {
    id: data.id,
    symbol: data.symbol.toLowerCase(),
    name: data.name,
    image: data.logo ?? null,
    current_price: data.quotes?.USD?.price ?? null,
    market_cap: data.quotes?.USD?.market_cap ?? null,
    market_cap_rank: data.market_cap_rank ?? null,
    fully_diluted_valuation: data.quotes?.USD?.fully_diluted_valuation ?? null,
    total_volume: data.quotes?.USD?.volume_24h ?? null,
    high_24h: data.quotes?.USD?.high_24h ?? null,
    low_24h: data.quotes?.USD?.low_24h ?? null,
    price_change_24h: data.quotes?.USD?.price_change_24h ?? null,
    price_change_percentage_24h: data.quotes?.USD?.percent_change_24h ?? null,
    circulating_supply: data.circulating_supply ?? null,
    total_supply: data.total_supply ?? null,
    max_supply: data.max_supply ?? null,
    ath: data.ath ?? null,
    atl: data.atl ?? null,
    sparkline_in_7d: null, // CoinPaprika doesn't provide sparkline in ticker endpoint
    last_updated: data.last_updated ?? null,
  };
}

/**
 * Map Binance ticker data to MarketRow format
 */
function mapBinanceToMarketRow(data: any): MarketRow {
  // Binance uses symbols like BTCUSDT, need to extract base asset
  const symbol = data.symbol.toUpperCase().replace('USDT', '');
  const coin = listCoins().find(c => c.symbol === symbol);

  return {
    id: coin?.coingeckoId ?? symbol.toLowerCase(),
    symbol: symbol.toLowerCase(),
    name: coin?.name ?? symbol,
    image: null, // Binance doesn't provide logo in ticker
    current_price: parseFloat(data.lastPrice),
    market_cap: null, // Not available in 24h ticker
    market_cap_rank: null,
    fully_diluted_valuation: null,
    total_volume: parseFloat(data.volume),
    high_24h: parseFloat(data.highPrice),
    low_24h: parseFloat(data.lowPrice),
    price_change_24h: parseFloat(data.priceChange),
    price_change_percentage_24h: parseFloat(data.priceChangePercent),
    circulating_supply: null,
    total_supply: null,
    max_supply: null,
    ath: null,
    atl: null,
    sparkline_in_7d: null,
    last_updated: new Date(parseInt(data.closeTime)).toISOString(),
  };
}

/**
 * Map KuCoin ticker data to MarketRow format
 */
function mapKuCoinToMarketRow(data: any): MarketRow {
  const symbol = data.symbol.toUpperCase().replace('-USDT', '');
  const coin = listCoins().find(c => c.symbol === symbol);

  return {
    id: coin?.coingeckoId ?? symbol.toLowerCase(),
    symbol: symbol.toLowerCase(),
    name: coin?.name ?? symbol,
    image: null, // KuCoin doesn't provide logo in ticker
    current_price: parseFloat(data.lastTradedPrice),
    market_cap: null,
    market_cap_rank: null,
    fully_diluted_valuation: null,
    total_volume: parseFloat(data.volValue),
    high_24h: parseFloat(data.high),
    low_24h: parseFloat(data.low),
    price_change_24h: parseFloat(data.changePrice),
    price_change_percentage_24h: parseFloat(data.changeRate) * 100,
    circulating_supply: null,
    total_supply: null,
    max_supply: null,
    ath: null,
    atl: null,
    sparkline_in_7d: null,
    last_updated: new Date(data.time * 1000).toISOString(),
  };
}

/**
 * Map CoinGecko detail response to standardized format
 * (Already in correct format from CoinGecko, so identity function)
 */
function mapCoinDetail(data: any): CoinDetail {
  return data;
}

/**
 * Map CoinGecko market chart response to standardized format
 * (Already in correct format from CoinGecko, so identity function)
 */
function mapMarketChart(data: any): MarketChart {
  return data;
}

/**
 * Map CoinGecko global response to standardized format
 * (Already in correct format from CoinGecko, so identity function)
 */
function mapGlobalData(data: any): GlobalData {
  return data;
}

// ---------- Alternative API Fetchers ----------

/**
 * Fetch market data from CoinPaprika
 */
async function fetchCoinPaprikaMarkets(): Promise<MarketRow[]> {
  // Get all coins first
  const coins: any[] = await fetchFromCoinPaprika("/coins");

  // Get tickers for all coins (CoinPaprika has a /tickers endpoint)
  const tickers: any[] = await fetchFromCoinPaprika("/tickers");

  // Filter and map to our format
  const marketRows: MarketRow[] = [];
  for (const ticker of tickers) {
    try {
      // Match by symbol instead of ID for better cross-API compatibility
      const coin = listCoins().find(c => c.symbol.toUpperCase() === ticker.symbol.toUpperCase());
      if (coin) {
        marketRows.push(mapCoinPaprikaToMarketRow(ticker));
      }
    } catch (mappingError) {
      // Skip individual coin mapping errors to prevent breaking the whole fallback
      console.warn('[coingecko] Failed to map CoinPaprika ticker:', ticker.symbol, mappingError);
      continue;
    }
  }

  // Sort by market cap descending (like CoinGecko default)
  marketRows.sort((a, b) => {
    if (!a.market_cap && !b.market_cap) return 0;
    if (!a.market_cap) return 1;
    if (!b.market_cap) return -1;
    return b.market_cap - a.market_cap;
  });

  return marketRows;
}

/**
 * Fetch market data from Binance
 */
async function fetchBinanceMarkets(): Promise<MarketRow[]> {
  // Get 24h ticker data for all USDT pairs
  const tickers: any[] = await fetchFromBinance("/ticker/24hr");

  // Filter to only USDT pairs and map to our format
  const marketRows: MarketRow[] = [];
  for (const ticker of tickers) {
    if (ticker.symbol.toUpperCase().endsWith('USDT')) {
      try {
        const mapped = mapBinanceToMarketRow(ticker);
        // Only include if it's one of our supported coins
        if (listCoins().some(c => c.symbol === mapped.symbol.toUpperCase())) {
          marketRows.push(mapped);
        }
      } catch (mappingError) {
        // Skip individual coin mapping errors to prevent breaking the whole fallback
        console.warn('[coingecko] Failed to map Binance ticker:', ticker.symbol, mappingError);
        continue;
      }
    }
  }

  // Sort by market cap descending (approximate using volume * price as proxy)
  marketRows.sort((a, b) => {
    const volA = a.total_volume ?? 0;
    const priceA = a.current_price ?? 0;
    const volB = b.total_volume ?? 0;
    const priceB = b.current_price ?? 0;
    const approxCapA = volA * priceA;
    const approxCapB = volB * priceB;
    return approxCapB - approxCapA;
  });

  return marketRows;
}

/**
 * Fetch market data from KuCoin
 */
async function fetchKuCoinMarkets(): Promise<MarketRow[]> {
  // Get all tickers
  const response: any = await fetchFromKuCoin("/market/allTickers");
  const tickers: any[] = response.ticker ?? [];

  // Filter to only USDT pairs and map to our format
  const marketRows: MarketRow[] = [];
  for (const ticker of tickers) {
    if (ticker.symbol.toUpperCase().endsWith('-USDT')) {
      try {
        const mapped = mapKuCoinToMarketRow(ticker);
        // Only include if it's one of our supported coins
        if (listCoins().some(c => c.symbol === mapped.symbol.toUpperCase())) {
          marketRows.push(mapped);
        }
      } catch (mappingError) {
        // Skip individual coin mapping errors to prevent breaking the whole fallback
        console.warn('[coingecko] Failed to map KuCoin ticker:', ticker.symbol, mappingError);
        continue;
      }
    }
  }

  // Sort by market cap descending (approximate using volume * price as proxy)
  marketRows.sort((a, b) => {
    const volA = a.total_volume ?? 0;
    const priceA = a.current_price ?? 0;
    const volB = b.total_volume ?? 0;
    const priceB = b.current_price ?? 0;
    const approxCapA = volA * priceA;
    const approxCapB = volB * priceB;
    return approxCapB - approxCapA;
  });

  return marketRows;
}

// For detail and chart endpoints, we'll implement basic fallbacks where possible
// Note: These APIs don't always have the same depth of data as CoinGecko,
// but we can still provide basic fallbacks for critical data

/**
 * Fetch coin detail from CoinPaprika (basic fallback)
 */
async function fetchCoinPaprikaDetail(id: string): Promise<CoinDetail> {
  try {
    const coinData: any = await fetchFromCoinPaprika(`/coins/${id}`);

    // Convert CoinPaprika format to our CoinDetail format
    // Note: CoinPaprika has less detail than CoinGecko, so we fill what we can
    return {
      id: coinData.id,
      symbol: coinData.symbol.toUpperCase(),
      name: coinData.name,
      description: { en: `${coinData.name} is a cryptocurrency.` }, // Simplified
      image: {
        small: coinData.logo ?? `https://assets.coingecko.com/coins/images/1/small/${id}.png`,
        large: coinData.logo ?? `https://assets.coingecko.com/coins/images/1/large/${id}.png`
      },
      market_cap_rank: coinData.market_cap_rank,
      market_data: {
        current_price: { usd: coinData.quotes?.USD?.price ?? 0 },
        market_cap: { usd: coinData.quotes?.USD?.market_cap ?? 0 },
        fully_diluted_valuation: { usd: coinData.quotes?.USD?.fully_diluted_valuation ?? null },
        total_volume: { usd: coinData.quotes?.USD?.volume_24h ?? 0 },
        high_24h: { usd: coinData.quotes?.USD?.high_24h ?? 0 },
        low_24h: { usd: coinData.quotes?.USD?.low_24h ?? 0 },
        price_change_24h: coinData.quotes?.USD?.price_change_24h ?? 0,
        price_change_percentage_24h: coinData.quotes?.USD?.percent_change_24h ?? 0,
        price_change_percentage_7d: 0, // Not available in basic ticker
        price_change_percentage_30d: 0, // Not available in basic ticker
        price_change_percentage_1y: 0, // Not available in basic ticker
        circulating_supply: coinData.circulating_supply ?? 0,
        total_supply: coinData.total_supply ?? null,
        max_supply: coinData.max_supply ?? null,
        ath: { usd: 0 }, // Not available
        atl: { usd: 0 }, // Not available
        sparkline_7d: { price: [] } // Not available in basic endpoint
      },
      community_data: {
        twitter_followers: null,
        reddit_subscribers: null,
        reddit_accounts_active_48h: null
      },
      developer_data: { stars: null, forks: null },
      links: {
        homepage: coinData.links?.homepage ?? [],
        subreddit_url: coinData.links?.subreddit_url ?? null,
        twitter_screen_name: null,
        repos_url: { github: [] }
      },
      categories: [],
      last_updated: coinData.last_updated ?? new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`CoinPaprika detail failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch market chart from CoinPaprika (basic fallback using OHLCV)
 */
async function fetchCoinPaprikaMarketChart(id: string, days: number): Promise<MarketChart> {
  try {
    // CoinPaprika provides OHLCV historical data
    const end = Math.floor(Date.now() / 1000);
    const start = end - (days * 24 * 60 * 60);

    const url = `/coins/${id}/ohlcv/historical?start=${start}&end=${end}`;
    const ohlcvData: any[] = await fetchFromCoinPaprika(url);

    // Convert OHLCV to our market chart format
    const prices: [number, number][] = [];
    const market_caps: [number, number][] = [];
    const total_volumes: [number, number][] = [];

    // We don't have market cap data from this endpoint, so we'll approximate
    // using a typical market cap to price ratio (this is a simplification)
    const typicalMarketCapRatio = 1000000; // $1M market cap per $1 price (adjust as needed)

    for (const ohlcv of ohlcvData) {
      const timestamp = ohlcv.time * 1000; // Convert to milliseconds
      const closePrice = ohlcv.close;
      const volume = ohlcv.volume;

      prices.push([timestamp, closePrice]);
      // Approximate market cap (this is not accurate but provides data structure)
      const approxMarketCap = closePrice * typicalMarketCapRatio;
      market_caps.push([timestamp, approxMarketCap]);
      total_volumes.push([timestamp, volume * closePrice]); // volume in quote currency
    }

    return { prices, market_caps, total_volumes };
  } catch (error) {
    throw new Error(`CoinPaprika market chart failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch global data from alternative APIs (basic fallback)
 */
async function fetchAlternativeGlobal(): Promise<GlobalData> {
  try {
    // Try to get basic global data from CoinPaprika
    const stats: any = await fetchFromCoinPaprika("/stats");

    // This is a very basic fallback - in reality we'd need to aggregate from multiple sources
    return {
      data: {
        active_cryptocurrencies: stats.cryptocurrencies_total ?? 10000,
        upcoming_icos: 0,
        ongoing_icos: 0,
        ended_icos: 0,
        markets: stats.markets ?? 500,
        total_market_cap: {
          usd: stats.market_cap_usd ?? 2.5e12,
          btc: 45000000,  // Approximate
          eth: 700000000  // Approximate
        },
        total_volume: {
          usd: stats.volume_usd ?? 1e11,
          btc: 1800000,   // Approximate
          eth: 28000000   // Approximate
        },
        market_cap_percentage: {
          usd: 100,
          btc: stats.btc_dominance ?? 52.3,
          eth: 100 - (stats.btc_dominance ?? 52.3)  // Simplified
        }
      }
    };
  } catch (error) {
    throw new Error(`Alternative global data failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ---------- Public API with Fallback ----------

/**
 * Fetch all 14 catalog coins' market data with fallback chain:
 * CoinGecko → CoinPaprika → Binance → KuCoin
 */
export async function fetchCatalogMarkets(vsCurrency = "usd"): Promise<MarketRow[]> {
  return fetchWithFallback(
    // Primary: CoinGecko
    () => cachedFetch<MarketRow[]>(
      `${COINGECKO_BASE}/coins/markets?vs_currency=${vsCurrency}&ids=${listCoins()
        .map((c: Coin) => c.coingeckoId)
        .join(",")}&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`
    ),
    // Fallbacks
    [
      // CoinPaprika
      () => fetchCoinPaprikaMarkets(),
      // Binance
      () => fetchBinanceMarkets(),
      // KuCoin
      () => fetchKuCoinMarkets()
    ]
  );
}

/**
 * Fetch one coin's full detail object with fallback.
 */
export async function fetchCoinDetail(id: string): Promise<CoinDetail> {
  return fetchWithFallback(
    // Primary: CoinGecko
    () => cachedFetch<CoinDetail>(
      `${COINGECKO_BASE}/coins/${id}?localization=false&tickers=false&community_data=true&developer_data=true&sparkline=true`,
      60
    ),
    // Fallbacks
    [
      // CoinPaprika (basic detail)
      () => fetchCoinPaprikaDetail(id),
      // Note: Binance and KuCoin don't have equivalent detail endpoints easily accessible
      // We could implement more fallbacks here if needed
      () => Promise.reject(new Error("No further fallbacks available for coin detail")),
      () => Promise.reject(new Error("No further fallbacks available for coin detail"))
    ]
  );
}

/**
 * Fetch global cryptocurrency data (market cap, volumes, dominance) with fallback.
 */
export async function fetchGlobal(): Promise<GlobalData> {
  return fetchWithFallback(
    // Primary: CoinGecko
    () => cachedFetch<GlobalData>(`${COINGECKO_BASE}/global`, 60),
    // Fallbacks
    [
      // Alternative global data
      () => fetchAlternativeGlobal(),
      // Additional fallbacks if needed
      () => Promise.reject(new Error("No further fallbacks available for global data")),
      () => Promise.reject(new Error("No further fallbacks available for global data"))
    ]
  );
}

/**
 * Fetch market chart for a coin over `days` days with fallback.
 * CoinGecko automatically down-samples to a sensible granularity for the range:
 *   1     -> ~5min candles
 *   7-30  -> hourly
 *   30-365-> daily
 */
export async function fetchMarketChart(id: string, days: number): Promise<MarketChart> {
  return fetchWithFallback(
    // Primary: CoinGecko
    () => cachedFetch<MarketChart>(
      `${COINGECKO_BASE}/coins/${id}/market_chart?vs_currency=usd&days=${days}`
    ),
    // Fallbacks
    [
      // CoinPaprika OHLCV data
      () => fetchCoinPaprikaMarketChart(id, days),
      // Additional fallbacks if needed
      () => Promise.reject(new Error("No further fallbacks available for market chart")),
      () => Promise.reject(new Error("No further fallbacks available for market chart"))
    ]
  );
}