/**
 * sentiment-real.ts — Real sentiment analysis from news sources.
 *
 * Uses CryptoPanic news API to derive market sentiment from news headlines.
 * Strategy:
 *   1. Try per-currency headlines first (most relevant signal).
 *   2. If that returns nothing (small-cap coins often have zero tagged news),
 *      fall back to the global feed and match against the coin's name/symbol.
 *   3. Only fall back to the deterministic mock if the news API itself is
 *      unavailable, OR no headlines match the coin at all.
 *
 * Falls back to deterministic mock sentiment if news API unavailable.
 */

import { fetchNews, fetchNewsForCurrencies } from "./news";
import { mockSentiment } from "./sentiment";
import { getCoin } from "./coins";

export interface RealSentiment {
  bullishPercent: number;
  bearishPercent: number;
  bullishVotes: number;
  bearishVotes: number;
  totalVotes: number;
  source: 'cryptopanic' | 'mock';
  confidence: number; // 0-1 based on data quality
}

const BULLISH_WORDS = [
  "surge", "rise", "gain", "bullish", "breakout", "rally", "highs", "ath",
  "profit", "buy", "buys", "buying", "positive", "growth", "increase",
  "soar", "soars", "jump", "jumps", "recover", "recovery", "approve",
  "approval", "adoption", "accumulate", "accumulation", "all-time",
];

const BEARISH_WORDS = [
  "drop", "drops", "fall", "falls", "decline", "declines", "bearish",
  "crash", "down", "lows", "loss", "sell", "selling", "sells", "risk",
  "negative", "decrease", "panic", "hack", "hacked", "exploit", "ban",
  "fraud", "lawsuit", "halt", "halts", "liquidat", "dump", "dumps",
];

function scoreHeadline(title: string): { bull: number; bear: number } {
  const lower = title.toLowerCase();
  let bull = 0;
  let bear = 0;
  for (const w of BULLISH_WORDS) if (lower.includes(w)) bull++;
  for (const w of BEARISH_WORDS) if (lower.includes(w)) bear++;
  return { bull, bear };
}

function coinMatches(itemTitle: string, symbol: string, name: string): boolean {
  const lower = itemTitle.toLowerCase();
  const sym = symbol.toLowerCase();
  if (lower.includes(sym)) return true;
  // Match on the coin name (case insensitive). Skip single-letter matches
  // to avoid false positives like "x" matching everything.
  if (name.length >= 3 && lower.includes(name.toLowerCase())) return true;
  return false;
}

export async function fetchRealSentiment(symbol: string): Promise<RealSentiment> {
  try {
    // 1) Per-currency headlines — highest signal.
    const tagged = await fetchNewsForCurrencies([symbol], 20);

    // 2) Fallback: global feed + match against name/symbol in the title.
    let relevant = tagged;
    let sourceLabel: 'cryptopanic' = 'cryptopanic';
    if (tagged.length === 0) {
      const coin = getCoin(symbol);
      const name = coin?.name ?? symbol;
      try {
        const global = await fetchNews(50);
        relevant = global.filter((it) => coinMatches(it.title, symbol, name)).slice(0, 20);
      } catch {
        relevant = [];
      }
    }

    if (relevant.length === 0) {
      throw new Error('No news found for sentiment analysis');
    }

    let bull = 0;
    let bear = 0;
    for (const item of relevant) {
      const s = scoreHeadline(item.title);
      bull += s.bull;
      bear += s.bear;
    }

    const total = bull + bear;
    if (total === 0) {
      // Headlines exist but no clear signal — surface as "mock" with low
      // confidence so the UI label reflects the situation honestly.
      const mock = mockSentiment(symbol);
      return { ...mock, source: "mock", confidence: 0 };
    }

    const bullishPercent = Math.round((bull / total) * 100);
    const bearishPercent = 100 - bullishPercent;

    // Confidence = blend of headline volume + signal clarity.
    const newsConfidence = Math.min(0.9, 0.5 + relevant.length / 100);
    const signalClarity = Math.abs(bullishPercent - 50) / 50;
    const confidence = Math.min(0.95, newsConfidence * 0.5 + signalClarity * 0.5);

    return {
      bullishPercent,
      bearishPercent,
      bullishVotes: Math.round((bullishPercent / 100) * relevant.length),
      bearishVotes: Math.round((bearishPercent / 100) * relevant.length),
      totalVotes: relevant.length,
      source: sourceLabel,
      confidence,
    };
  } catch (error) {
    console.warn('[sentiment-real] Real sentiment failed, falling back to mock:', error);
    const mock = mockSentiment(symbol);
    return { ...mock, source: "mock", confidence: 0 };
  }
}