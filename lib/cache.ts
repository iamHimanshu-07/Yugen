/**
 * cache.ts — Unified caching layer with TTL, stale-while-revalidate, and LRU eviction.
 *
 * Replaces per-file LRU maps with a single typed Cache class.
 * Works with Next.js `fetch(..., { next: { revalidate } })` for edge caching too.
 */

export interface CacheOptions<T> {
  /** Time-to-live in seconds (freshness). */
  ttl: number;
  /** Stale-while-revalidate window in seconds (serve stale while fetching fresh). */
  swr?: number;
  /** Maximum entries before LRU eviction. */
  maxSize?: number;
  /** Optional key serializer for complex keys. */
  serializeKey?: (key: string) => string;
}

interface CacheEntry<T> {
  value: T;
  freshUntil: number;   // absolute timestamp when fresh TTL expires
  staleUntil: number;   // absolute timestamp when stale-while-revalidate expires
}

/**
 * Generic cache with TTL + SWR + LRU eviction.
 * In-memory only — suitable for single-instance or serverless with warm starts.
 */
export class Cache<T> {
  private readonly store = new Map<string, CacheEntry<T>>();
  private readonly order = new Set<string>(); // LRU order (oldest first)

  constructor(
    private readonly options: CacheOptions<T>,
  ) {
    this.options.maxSize ??= 500;
    this.options.swr ??= this.options.ttl; // default SWR = TTL
  }

  private serialize(key: string): string {
    return this.options.serializeKey ? this.options.serializeKey(key) : key;
  }

  private now(): number {
    return Date.now();
  }

  private touch(key: string): void {
    // Move to end (most recently used)
    this.order.delete(key);
    this.order.add(key);
  }

  private evictIfNeeded(): void {
    while (this.store.size > this.options.maxSize!) {
      const oldest = this.order.values().next().value;
      if (oldest) {
        this.store.delete(oldest);
        this.order.delete(oldest);
      } else {
        break;
      }
    }
  }

  private isFresh(entry: CacheEntry<T>): boolean {
    return this.now() < entry.freshUntil;
  }

  private isUsable(entry: CacheEntry<T>): boolean {
    return this.now() < entry.staleUntil;
  }

  /**
   * Get cached value if fresh. Returns undefined if missing or stale.
   * Does NOT update LRU on miss.
   */
  get(key: string): T | undefined {
    const k = this.serialize(key);
    const entry = this.store.get(k);
    if (!entry) return undefined;
    if (!this.isUsable(entry)) {
      // Expired completely — remove
      this.store.delete(k);
      this.order.delete(k);
      return undefined;
    }
    if (this.isFresh(entry)) {
      this.touch(k);
      return entry.value;
    }
    // Stale but usable — return but don't touch (caller should revalidate)
    return entry.value;
  }

  /**
   * Get cached value regardless of freshness (for SWR patterns).
   * Returns { value, isStale }.
   */
  getWithStale(key: string): { value: T; isStale: boolean } | undefined {
    const k = this.serialize(key);
    const entry = this.store.get(k);
    if (!entry || !this.isUsable(entry)) {
      if (entry) { this.store.delete(k); this.order.delete(k); }
      return undefined;
    }
    this.touch(k);
    return { value: entry.value, isStale: !this.isFresh(entry) };
  }

  /**
   * Set value with TTL and SWR windows.
   * Updates LRU position.
   */
  set(key: string, value: T): void {
    const k = this.serialize(key);
    const now = this.now();
    const ttlMs = this.options.ttl * 1000;
    const swrMs = this.options.swr! * 1000;
    this.store.set(k, {
      value,
      freshUntil: now + ttlMs,
      staleUntil: now + swrMs,
    });
    this.touch(k);
    this.evictIfNeeded();
  }

  /** Delete a key. */
  delete(key: string): boolean {
    const k = this.serialize(key);
    this.order.delete(k);
    return this.store.delete(k);
  }

  /** Clear all entries. */
  clear(): void {
    this.store.clear();
    this.order.clear();
  }

  /** Current size. */
  get size(): number {
    return this.store.size;
  }

  /** Debug: all keys with freshness status. */
  inspect(): Array<{ key: string; fresh: boolean; stale: boolean }> {
    const now = this.now();
    return Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      fresh: now < entry.freshUntil,
      stale: now < entry.staleUntil,
    }));
  }
}

/**
 * Factory for typed caches with default options per data type.
 */
export function createCache<T>(options: CacheOptions<T>): Cache<T> {
  return new Cache<T>(options);
}

/* ============================================================
 * singleFlight — dedupe concurrent in-flight requests.
 *
 * During a cold cache (e.g. 21 coin pages prerendering in parallel,
 * /feed.xml, /api/news, /api/chart at once), many callers race for the
 * same upstream URL. Without dedup, they all hit CoinGecko / CryptoPanic
 * simultaneously — burning rate limits and triggering 429s.
 *
 * The pattern: stash the in-flight Promise in a Map keyed by URL. The
 * first caller launches the fetch; everyone else awaits the same Promise.
 * On settle (success or failure), delete the entry so the next cold
 * cache kicks off a fresh fetch.
 *
 * Combined with TTL+SWR caching, this gives:
 *   - Single upstream hit per cache window during fan-out
 *   - Stale-while-revalidate mean concurrent callers never see a miss
 *   - Failures don't poison the cache (we don't write to `cache` on reject)
 * ============================================================ */
const inflight = new Map<string, Promise<unknown>>();

export async function singleFlight<T>(
  cache: Cache<T>,
  key: string,
  fetcher: () => Promise<T | null>,
): Promise<T | null> {
  // 1. Cache hit — return immediately.
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  // 2. Already in flight — share the promise.
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T | null>;

  // 3. New fetch — track it, then unwrap.
  const promise = (async () => {
    try {
      const value = await fetcher();
      if (value !== null && value !== undefined) cache.set(key, value as T);
      return value as T | null;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, promise);
  return promise;
}

/**
 * Test/debug: snapshot of in-flight keys (size only — promises are not
 * serializable). Useful for `gain` diagnostics and for asserting that
 * a fan-out finished draining.
 */
export function singleFlightInflightSize(): number {
  return inflight.size;
}

/** Pre-configured caches for Yugen's data types. */
export const Caches = {
  /** Market catalog — 60s fresh, 120s stale, 50 entries. */
  markets: createCache<import("./coingecko").MarketRow[]>({
    ttl: 60,
    swr: 120,
    maxSize: 50,
  }),

  /** Coin detail — 60s fresh, 120s stale, 20 entries. */
  coinDetail: createCache<import("./coingecko").CoinDetail>({
    ttl: 60,
    swr: 120,
    maxSize: 20,
  }),

  /** Market chart — 60s fresh, 120s stale, 30 entries (per coin × range). */
  marketChart: createCache<import("./coingecko").MarketChart>({
    ttl: 60,
    swr: 120,
    maxSize: 30,
    serializeKey: (k) => `chart:${k}`,
  }),

  /** Reddit posts — 120s fresh, 300s stale, 20 entries. */
  social: createCache<import("./reddit").SocialPost[]>({
    ttl: 120,
    swr: 300,
    maxSize: 20,
    serializeKey: (k) => `social:${k}`,
  }),

  /** DefiLlama TVL — 300s fresh, 600s stale, 20 entries. */
  defillamaTvl: createCache<import("./defillama").DefiLlamaTvlResponse>({
    ttl: 300,
    swr: 600,
    maxSize: 20,
    serializeKey: (k) => `defillama:tvl:${k}`,
  }),

  /** DefiLlama protocols — 300s fresh, 600s stale, 10 entries. */
  defillamaProtocols: createCache<import("./defillama").Protocol[]>({
    ttl: 300,
    swr: 600,
    maxSize: 10,
  }),

  /** DefiLlama historical TVL — 300s fresh, 600s stale, 20 entries. */
  defillamaHistoricalTvl: createCache<import("./defillama").HistoricalChainTvl[]>({
    ttl: 300,
    swr: 600,
    maxSize: 20,
    serializeKey: (k) => `defillama:historical:${k}`,
  }),

  /** News — 300s fresh, 600s stale, 10 entries. */
  news: createCache<import("./news").NewsItem[]>({
    ttl: 300,
    swr: 600,
    maxSize: 10,
  }),

  /** Fear & Greed — 3600s fresh, 7200s stale, 5 entries. */
  fearGreed: createCache<import("./fear-greed").FearGreedResponse>({
    ttl: 3600,
    swr: 7200,
    maxSize: 5,
  }),

  /** BTC prediction — 3600s fresh, 7200s stale, 5 entries. */
  prediction: createCache<{
    prediction: import("./prediction").BtcPrediction;
    timestamp: number;
  }>({
    ttl: 3600,
    swr: 7200,
    maxSize: 5,
  }),
} as const;