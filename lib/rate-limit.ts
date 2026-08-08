/**
 * rate-limit.ts — Token bucket rate limiter for external APIs.
 *
 * Each named bucket has its own capacity, refill rate, and tracks placed calls.
 * Shared across all fetchers via singleton `RateLimiter`.
 *
 * CoinGecko free: ~30 req/min  → capacity 10, refill 0.5/sec
 * DefiLlama: ~100 req/min     → capacity 20, refill 1.67/sec
 * CryptoPanic: ~100 req/min   → capacity 20, refill 1.67/sec
 * Alternative.me (F&G): ~60 req/min → capacity 10, refill 1/sec
 */

export interface BucketConfig {
  capacity: number;      // max tokens (burst allowance)
  refillPerSec: number;  // tokens added per second
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  remaining: number;
}

/**
 * Token bucket with async wait support.
 * Not thread-safe across processes — fine for single Next.js server instance.
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.lastRefill = now;
  }

  /** Try to take 1 token. Returns result without waiting. */
  tryTake(): RateLimitResult {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }
    // Calculate wait time until 1 token available
    const needed = 1 - this.tokens;
    const retryAfterMs = Math.ceil((needed / this.refillPerSec) * 1000);
    return { allowed: false, retryAfterMs, remaining: 0 };
  }

  /** Take 1 token, waiting if necessary (with jitter). */
  async take(): Promise<RateLimitResult> {
    const result = this.tryTake();
    if (result.allowed) return result;

    // Wait with jitter (±10%) to avoid thundering herd
    const waitMs = result.retryAfterMs! * (0.9 + Math.random() * 0.2);
    await new Promise((r) => setTimeout(r, waitMs));
    return this.take(); // recursive retry after wait
  }

  /** Current available tokens (for debugging/metrics). */
  get available(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

/**
 * Singleton rate limiter managing multiple named buckets.
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private readonly buckets = new Map<string, TokenBucket>();

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /** Get or create a bucket with the given config. */
  bucket(name: string, config: BucketConfig): TokenBucket {
    let bucket = this.buckets.get(name);
    if (!bucket) {
      bucket = new TokenBucket(config.capacity, config.refillPerSec);
      this.buckets.set(name, bucket);
    }
    return bucket;
  }

  /** Pre-configured buckets for known APIs. */
  static readonly PRESETS: Record<string, BucketConfig> = {
    coingecko: { capacity: 10, refillPerSec: 0.5 },      // ~30/min
    defillama: { capacity: 20, refillPerSec: 1.67 },     // ~100/min
    cryptopanic: { capacity: 20, refillPerSec: 1.67 },   // ~100/min
    feargreed: { capacity: 10, refillPerSec: 1 },        // ~60/min
  };

  /** Convenience: take from a preset bucket. */
  async takePreset(name: keyof typeof RateLimiter.PRESETS): Promise<RateLimitResult> {
    const config = RateLimiter.PRESETS[name];
    return this.bucket(name, config).take();
  }

  /** Check all bucket statuses (for /api/health or debugging). */
  getStatus(): Record<string, { available: number; capacity: number }> {
    const out: Record<string, { available: number; capacity: number }> = {};
    for (const [name, bucket] of this.buckets) {
      out[name] = { available: bucket.available, capacity: (bucket as any).capacity };
    }
    return out;
  }
}

/** Helper: wait for rate limit, then run fn. Throws if fn throws. */
export async function withRateLimit<T>(
  preset: keyof typeof RateLimiter.PRESETS,
  fn: () => Promise<T>,
): Promise<T> {
  const limiter = RateLimiter.getInstance();
  await limiter.takePreset(preset);
  return fn();
}

/** Helper: try once, return null if rate limited (no wait). */
export async function tryWithRateLimit<T>(
  preset: keyof typeof RateLimiter.PRESETS,
  fn: () => Promise<T>,
): Promise<T | null> {
  const limiter = RateLimiter.getInstance();
  const result = limiter.bucket(preset, RateLimiter.PRESETS[preset]).tryTake();
  if (!result.allowed) return null;
  return fn();
}