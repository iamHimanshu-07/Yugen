/**
 * fear-greed.ts — Server-side fetcher for Alternative.me Fear & Greed Index.
 *
 * Free, no API key needed. Updates daily.
 * Endpoint: https://api.alternative.me/fng/
 */

import { withRateLimit } from "./rate-limit";
import { Caches } from "./cache";

const BASE = "https://api.alternative.me";
const REVALIDATE_SECONDS = 3600; // 1 hour (index updates daily)

// ---------- Types -----------------------------------------------------------

export interface FearGreedEntry {
  value: number;           // 0-100
  value_classification: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  timestamp: number;       // unix
  time_until_update: string;
}

export interface FearGreedResponse {
  name: "Fear and Greed Index";
  data: FearGreedEntry[];
  metadata: { error: null | string };
}

// ---------- Cache key -------------------------------------------------------

const FG_KEY = "fear-greed:latest";

// ---------- Public API ------------------------------------------------------

/**
 * Fetch latest Fear & Greed index (current + limited history).
 * Returns parsed response with typed data array.
 */
export async function fetchFearGreed(limit = 30): Promise<FearGreedResponse> {
  const cached = Caches.fearGreed.get(FG_KEY);
  if (cached) {
    // Return cached with sliced history
    return { name: "Fear and Greed Index", data: cached.data.slice(0, limit), metadata: cached.metadata };
  }

  const url = `${BASE}/fng/?limit=${limit}&format=json`;

  const data = await withRateLimit("feargreed", async () => {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "yugen/1.0" },
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) {
      throw new Error(`Fear & Greed ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as FearGreedResponse;
  });

  Caches.fearGreed.set(FG_KEY, data);
  return data;
}

/**
 * Get just the current Fear & Greed value and classification.
 */
export async function getCurrentFearGreed(): Promise<{
  value: number;
  classification: string;
  timestamp: number;
} | null> {
  const data = await fetchFearGreed(1);
  const latest = data.data[0];
  if (!latest) return null;
  return {
    value: latest.value,
    classification: latest.value_classification,
    timestamp: latest.timestamp,
  };
}

/**
 * Get Fear & Greed history for charting.
 * Returns [timestamp_ms, value] points.
 */
export async function fetchFearGreedHistory(days = 30): Promise<[number, number][]> {
  const data = await fetchFearGreed(days + 2); // extra buffer
  return data.data
    .slice(0, days)
    .map((d) => [d.timestamp * 1000, d.value] as [number, number])
    .sort((a, b) => a[0] - b[0]); // ascending time
}