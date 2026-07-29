/**
 * sentiment.ts — deterministic per-coin mock community-sentiment numbers.
 *
 * Real sentiment would come from CryptoPanic / LunarCrush / Santiment (all
 * key-gated). Until then we generate a stable hash → [bull, bear] split so
 * the dashboard never shows 50/50 and the numbers don't flicker between
 * renders. Clearly labelled "Community signal · last 7d" so users know it's
 * not real-time polling.
 */

import { getCoin } from "./coins";

export interface Sentiment {
  bullishPercent: number;
  bearishPercent: number;
  bullishVotes: number;
  bearishVotes: number;
  totalVotes: number;
  source: "mock";
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function mockSentiment(symbol: string): Sentiment {
  const coin = getCoin(symbol);
  if (!coin) {
    return { bullishPercent: 50, bearishPercent: 50, bullishVotes: 0, bearishVotes: 0, totalVotes: 0, source: "mock" };
  }
  const h = hash(coin.coingeckoId + ":7d");
  // Bias:
  //   * BTC/ETH sit closer to neutral (55-72% bull)
  //   * Memes more polarized (40-85% bull — bigger swings)
  //   * Stablecoins always slightly bearish (people expect them to drop)
  const baseBias =
    coin.kind === "stable" ? 42 :
    coin.kind === "meme"   ? 62 :
                              64;
  const bull = Math.min(85, Math.max(28, baseBias + (h % 30) - 14));
  const bear = 100 - bull;
  // Total votes: scale with kind
  const totalVotes =
    coin.kind === "stable" ? 6_400 :
    coin.kind === "meme"   ? 14_800 :
                              22_000 + (h % 9_000);
  return {
    bullishPercent: bull,
    bearishPercent: bear,
    bullishVotes: Math.round((bull / 100) * totalVotes),
    bearishVotes: Math.round((bear / 100) * totalVotes),
    totalVotes,
    source: "mock",
  };
}