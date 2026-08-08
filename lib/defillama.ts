/**
 * defillama.ts — Server-side fetchers for DefiLlama's free public API.
 *
 * No API key needed. Generous rate limits (~100 req/min).
 * All fetchers are safe to call from Server Components and Route Handlers.
 *
 * Endpoints used:
 *   GET /v2/chains                    — list all chains with TVL
 *   GET /v2/historicalChainTvl/{chain} — TVL history for a chain
 *   GET /protocols                    — list all protocols with TVL
 */

import { withRateLimit } from "./rate-limit";
import { Caches } from "./cache";

const BASE = "https://api.llama.fi";
const REVALIDATE_SECONDS = 300; // 5 min

// ---------- Types -----------------------------------------------------------

export interface ChainTvl {
  name: string;
  gecko_id: string | null;
  tvl: number;
  tokenSymbol: string | null;
  cmcId: string | null;
  category: string | null;
  chains: string[] | null;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
}

export interface HistoricalChainTvl {
  date: number;      // unix timestamp (seconds)
  tvl: number;       // USD value at that snapshot — actual field name from DefiLlama
}

export interface Protocol {
  id: string;
  name: string;
  address: string | null;
  symbol: string | null;
  url: string;
  description: string | null;
  chain: string;
  logo: string | null;
  audits: string | null;
  audit_note: string | null;
  gecko_id: string | null;
  cmcId: string | null;
  category: string;
  chains: string[];
  module: string | null;
  twitter: string | null;
  forkedFrom: string[] | null;
  oracles: string[] | null;
  listedAt: number;
  methodology: string | null;
  slug: string;
  tvl: number;
  chainTvls: Record<string, number>;
  change_1h: number | null;
  change_1d: number | null;
  change_7d: number | null;
  mcap: number | null;
}

// Exported type for the TVL response (array of ChainTvl)
export type DefiLlamaTvlResponse = ChainTvl[];

// ---------- Cache keys ------------------------------------------------------

// Pre-warm cache keys we'll use
const CHAIN_TVL_KEY = "chains";
const PROTOCOLS_KEY = "protocols";

// ---------- Internal fetch with caching -------------------------------------

async function cachedDefiLlamaFetch(url: string, cacheKey: string, cache: typeof Caches.defillamaTvl): Promise<DefiLlamaTvlResponse> {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  // Fetch with rate limiting
  const data = await withRateLimit("defillama", async () => {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "yugen/1.0" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`DefiLlama ${res.status}: ${res.statusText} (${url})`);
    }
    return (await res.json()) as DefiLlamaTvlResponse;
  });

  cache.set(cacheKey, data);
  return data;
}

async function cachedProtocolsFetch(url: string, cacheKey: string, cache: typeof Caches.defillamaProtocols): Promise<Protocol[]> {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const data = await withRateLimit("defillama", async () => {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "yugen/1.0" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`DefiLlama ${res.status}: ${res.statusText} (${url})`);
    }
    return (await res.json()) as Protocol[];
  });

  cache.set(cacheKey, data);
  return data;
}

// ---------- Public API ------------------------------------------------------

/**
 * Fetch all chains with current TVL.
 * Returns array sorted by TVL desc.
 */
export async function fetchChainsTvl(): Promise<ChainTvl[]> {
  const url = `${BASE}/v2/chains`;
  const data = await cachedDefiLlamaFetch(url, CHAIN_TVL_KEY, Caches.defillamaTvl);
  // Sort by TVL descending
  return data.sort((a, b) => b.tvl - a.tvl);
}

/**
 * Fetch historical TVL for a specific chain.
 * Returns daily snapshots.
 *
 * @param chain   DefiLlama chain name (e.g. "Ethereum")
 * @param days    Optional window to trim to (e.g. 30 → only last 30 days).
 *                DefiLlama returns 3000+ rows per chain; the chart only needs 30.
 *                When provided, the cached full history is sliced on read.
 */
export async function fetchHistoricalChainTvl(chain: string, days?: number): Promise<HistoricalChainTvl[]> {
  const cacheKey = `historical:${chain.toLowerCase()}`;
  const url = `${BASE}/v2/historicalChainTvl/${encodeURIComponent(chain)}`;

  // Use dedicated historical TVL cache
  const cached = Caches.defillamaHistoricalTvl.get(cacheKey);
  if (cached) {
    return days ? trimToDays(cached, days) : cached;
  }

  const data = await withRateLimit("defillama", async () => {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "yugen/1.0" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`DefiLlama ${res.status}: ${res.statusText} (${url})`);
    }
    return (await res.json()) as HistoricalChainTvl[];
  });

  Caches.defillamaHistoricalTvl.set(cacheKey, data);
  return days ? trimToDays(data, days) : data;
}

/** Return only the rows within the last `days` days of the snapshot series. */
function trimToDays(rows: HistoricalChainTvl[], days: number): HistoricalChainTvl[] {
  if (rows.length === 0) return rows;
  const cutoff = Date.now() / 1000 - days * 86400;
  // Rows are daily, oldest first; binary search for the first row >= cutoff.
  let lo = 0;
  let hi = rows.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (rows[mid].date < cutoff) lo = mid + 1;
    else hi = mid;
  }
  return rows.slice(lo);
}

/**
 * Fetch top protocols by TVL.
 * Returns array sorted by TVL desc.
 */
export async function fetchProtocols(limit = 50): Promise<Protocol[]> {
  const url = `${BASE}/protocols`;
  const data = await cachedProtocolsFetch(url, PROTOCOLS_KEY, Caches.defillamaProtocols);
  return data
    // ~14% of /protocols rows have null TVL (CEXs, chains, etc.) — guard before compare.
    .filter((p) => p.tvl != null && p.tvl > 0)
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
    .slice(0, limit);
}

/**
 * Fetch TVL for a single chain (current snapshot from chains list).
 */
export async function fetchSingleChainTvl(chain: string): Promise<ChainTvl | null> {
  const chains = await fetchChainsTvl();
  return chains.find((c) => c.name.toLowerCase() === chain.toLowerCase()) ?? null;
}

/**
 * Get top N chains by TVL (for dashboard cards).
 */
export async function fetchTopChains(n = 10): Promise<ChainTvl[]> {
  const chains = await fetchChainsTvl();
  return chains.slice(0, n);
}

/**
 * Get TVL change for a chain over a period.
 */
export async function getChainTvlChange(chain: string, days = 7): Promise<{ current: number; change: number; changePct: number } | null> {
  const historical = await fetchHistoricalChainTvl(chain, days + 1);
  if (historical.length === 0) return null;

  const current = historical[historical.length - 1].tvl;
  const cutoff = Date.now() / 1000 - days * 86400;
  // Find the snapshot just before cutoff (not after) so a same-day update
  // doesn't make the comparison window zero-length.
  const past = [...historical].reverse().find((h) => h.date <= cutoff) ?? historical[0];
  const change = current - past.tvl;
  const changePct = past.tvl > 0 ? (change / past.tvl) * 100 : 0;

  return { current, change, changePct };
}