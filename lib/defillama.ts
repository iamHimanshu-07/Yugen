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
import { hashString } from "./utils";

const BASE = "https://api.llama.fi";
const REVALIDATE_SECONDS = 300; // 5 min

/**
 * Check if we're running in a local development environment.
 * In production (Vercel), this will be false and real API calls will be made.
 */
function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== "production";
}

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
  try {
    const data = await cachedDefiLlamaFetch(url, CHAIN_TVL_KEY, Caches.defillamaTvl);
    // Sort by TVL descending
    return data.sort((a, b) => b.tvl - a.tvl);
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[defillama] fetchChainsTvl failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockChainsTvl();
    }
    throw error;
  }
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

  try {
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
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[defillama] fetchHistoricalChainTvl failed for ${chain}, using mock:`, error instanceof Error ? error.message : String(error));
      return generateMockHistoricalChainTvl(chain);
    }
    throw error;
  }
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
  try {
    const data = await cachedProtocolsFetch(url, PROTOCOLS_KEY, Caches.defillamaProtocols);
    return data
      // ~14% of /protocols rows have null TVL (CEXs, chains, etc.) — guard before compare.
      .filter((p) => p.tvl != null && p.tvl > 0)
      .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, limit);
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[defillama] fetchProtocols failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockProtocols().slice(0, limit);
    }
    throw error;
  }
}

/**
 * Fetch TVL for a single chain (current snapshot from chains list).
 */
export async function fetchSingleChainTvl(chain: string): Promise<ChainTvl | null> {
  try {
    const chains = await fetchChainsTvl();
    return chains.find((c) => c.name.toLowerCase() === chain.toLowerCase()) ?? null;
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[defillama] fetchSingleChainTvl failed for ${chain}, using mock:`, error instanceof Error ? error.message : String(error));
      const mockChains = generateMockChainsTvl();
      return mockChains.find((c) => c.name.toLowerCase() === chain.toLowerCase()) ?? null;
    }
    throw error;
  }
}

/**
 * Get top N chains by TVL (for dashboard cards).
 */
export async function fetchTopChains(n = 10): Promise<ChainTvl[]> {
  try {
    const chains = await fetchChainsTvl();
    return chains.slice(0, n);
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[defillama] fetchTopChains failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockChainsTvl().slice(0, n);
    }
    throw error;
  }
}

/**
 * Get TVL change for a chain over a period.
 */
export async function getChainTvlChange(chain: string, days = 7): Promise<{ current: number; change: number; changePct: number } | null> {
  try {
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
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[defillama] getChainTvlChange failed for ${chain}, using mock:`, error instanceof Error ? error.message : String(error));
      // Generate mock change data
      const seed = hashString(chain);
      const changePct = ((seed % 20) - 10); // -10% to +10%
      const current = {
        "ethereum": 28000000000,
        "binance-smart-chain": 8500000000,
        "solana": 3200000000,
        "avalanche": 1800000000,
        "polygon-pos": 1200000000,
      }[chain] || 1000000000;
      const change = current * (changePct / 100);

      return { current, change, changePct };
    }
    throw error;
  }
}

// ---------- Local Development Mocks ------------------------------------------

/**
 * Generate deterministic mock chains TVL data for local development.
 */
function generateMockChainsTvl(): ChainTvl[] {
  return [
    {
      name: "Ethereum",
      gecko_id: "ethereum",
      tvl: 28000000000 + Math.random() * 1000000000,
      tokenSymbol: "ETH",
      cmcId: "1027",
      category: "Smart Contract Platform",
      chains: ["Ethereum"],
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
    },
    {
      name: "Binance Smart Chain",
      gecko_id: "binance-smart-chain",
      tvl: 8500000000 + Math.random() * 500000000,
      tokenSymbol: "BNB",
      cmcId: "1839",
      category: "Smart Contract Platform",
      chains: ["Binance Smart Chain"],
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
    },
    {
      name: "Solana",
      gecko_id: "solana",
      tvl: 3200000000 + Math.random() * 200000000,
      tokenSymbol: "SOL",
      cmcId: "5426",
      category: "Smart Contract Platform",
      chains: ["Solana"],
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
    },
    {
      name: "Avalanche",
      gecko_id: "avalanche",
      tvl: 1800000000 + Math.random() * 100000000,
      tokenSymbol: "AVAX",
      cmcId: "5805",
      category: "Smart Contract Platform",
      chains: ["Avalanche"],
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
    },
    {
      name: "Polygon",
      gecko_id: "polygon-pos",
      tvl: 1200000000 + Math.random() * 80000000,
      tokenSymbol: "MATIC",
      cmcId: "3890",
      category: "Smart Contract Platform",
      chains: ["Polygon"],
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
    },
  ];
}

/**
 * Generate deterministic mock historical TVL for local development.
 */
function generateMockHistoricalChainTvl(chain: string): HistoricalChainTvl[] {
  const now = Date.now() / 1000;
  const baseTvl = {
    "ethereum": 28000000000,
    "binance-smart-chain": 8500000000,
    "solana": 3200000000,
    "avalanche": 1800000000,
    "polygon-pos": 1200000000,
  }[chain] || 1000000000;

  const data: HistoricalChainTvl[] = [];
  for (let i = 0; i < 30; i++) {
    const daysAgo = i;
    const timestamp = now - (daysAgo * 86400);
    // Add some deterministic variation based on chain name and day
    const seed = hashString(chain + ":" + daysAgo.toString());
    const variation = 0.8 + (seed % 400) / 1000; // 0.8 to 1.2
    const tvl = baseTvl * variation;

    data.push({
      date: Math.floor(timestamp),
      tvl: tvl
    });
  }

  // Return in ascending order (oldest first)
  return data.reverse();
}

/**
 * Generate deterministic mock protocols data for local development.
 */
function generateMockProtocols(): Protocol[] {
  return [
    {
      id: "lido",
      name: "Lido",
      address: null,
      symbol: "LDO",
      url: "https://lido.fi",
      description: "Liquid staking protocol for Ethereum and other PoS blockchains",
      chain: "Ethereum",
      logo: "https://assets.coingecko.com/coins/images/11319/large/lido-dao_(ldo).png",
      audits: null,
      audit_note: null,
      gecko_id: "lido-dao",
      cmcId: "9588",
      category: "Liquid Staking",
      chains: ["Ethereum", "Solana", "Polygon"],
      module: null,
      twitter: "LidoFinance",
      forkedFrom: null,
      oracles: null,
      listedAt: 1615132800,
      methodology: null,
      slug: "lido",
      tvl: 12000000000,
      chainTvls: {
        "Ethereum": 10000000000,
        "Solana": 1500000000,
        "Polygon": 500000000
      },
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
      mcap: 2000000000
    },
    {
      id: "aave",
      name: "Aave",
      address: null,
      symbol: "AAVE",
      url: "https://aave.com",
      description: "Decentralized non-custodial liquidity market protocol",
      chain: "Ethereum",
      logo: "https://assets.coingecko.com/coins/images/12824/large/aave.png",
      audits: null,
      audit_note: null,
      gecko_id: "aave",
      cmcId: "1818",
      category: "Lending & Borrowing",
      chains: ["Ethereum", "Polygon", "Avalanche"],
      module: null,
      twitter: "AaveAave",
      forkedFrom: null,
      oracles: null,
      listedAt: 1583020800,
      methodology: null,
      slug: "aave",
      tvl: 8500000000,
      chainTvls: {
        "Ethereum": 6000000000,
        "Polygon": 1500000000,
        "Avalanche": 1000000000
      },
      change_1h: ((Math.random() * 4) - 2),
      change_1d: ((Math.random() * 10) - 5),
      change_7d: ((Math.random() * 15) - 7),
      mcap: 1500000000
    }
  ];
}