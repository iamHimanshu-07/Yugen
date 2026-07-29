/**
 * reddit.ts — fetch posts from Reddit's public JSON endpoint (no key needed).
 *
 * Reddit blocks requests that lack a User-Agent, so we always go through
 * this server-side module (or the Route Handler at /api/social/[id]).
 *
 * Falls back to a deterministic mock if Reddit blocks the egress (e.g. on
 * some VPS providers) so the UI still renders something meaningful.
 */
import { hashString, relativeTime } from "@/lib/utils";
import { getCoin } from "@/lib/coins";

export interface SocialPost {
  id: string;
  author: string;
  snippet: string;
  url: string;
  permalink: string;
  score: number;
  comments: number;
  ageMs: number;
  ageLabel: string;
  verified: boolean;
  source: "reddit" | "mock";
  subreddit: string;
}

const REDDIT_UA = "Mozilla/5.0 (compatible; yugen/1.0; +https://github.com)";

async function tryFetch(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": REDDIT_UA, Accept: "application/json" },
      // 5s budget so a blocked Reddit doesn't stall the page.
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface RedditChild {
  kind: string;
  data: {
    id: string;
    title: string;
    selftext: string;
    subreddit_name_prefixed: string;
    author: string;
    permalink: string;
    url_overridden_by_dest?: string;
    score: number;
    num_comments: number;
    created_utc: number;
    link_flair_text?: string | null;
    distinguished?: string | null;
  };
}

interface RedditListing {
  data: { children: RedditChild[] };
}

const FLAVOR_LINES = [
  "Volume is surging and the order book is tilting — feels like a breakout week.",
  "Holding through the dip. Fundamentals haven't changed.",
  "On-chain accumulation quietly accelerating. Whales are buying.",
  "Macro still a headwind, but the technicals look constructive here.",
  "Funding rates flipping positive again. Watching closely.",
  "Devs shipping. That's the part that matters long-term.",
  "Risk is over-leveraged longs getting squeezed. Manage size.",
  "Sentiment feels washed out. That can be a signal in itself.",
  "ETF flows haven't been this positive in weeks.",
  "Looking at the chart, this looks like a healthy retest of breakout levels.",
];

function pickFlavor(seed: string, i: number) {
  return FLAVOR_LINES[(hashString(seed) + i) % FLAVOR_LINES.length];
}

export async function fetchSocialPosts(symbol: string, limit = 8): Promise<SocialPost[]> {
  const coin = getCoin(symbol);
  if (!coin) return mockPosts(symbol, limit);

  const query = encodeURIComponent(coin.name);
  const subs = [`r/${coin.symbol}`, "r/CryptoCurrency", "r/CryptoMarkets"].join("+");
  const url = `https://www.reddit.com/search.json?q=${query}+(${subs})&sort=top&t=week&limit=${limit + 4}`;

  const data = await tryFetch(url);
  if (!data) return mockPosts(symbol, limit);

  try {
    const listing = data as RedditListing;
    const items: SocialPost[] = listing.data.children
      .filter((c) => c.kind === "t3" && c.data && c.data.title)
      .slice(0, limit)
      .map((c) => {
        const d = c.data;
        const ageMs = Date.now() - d.created_utc * 1000;
        const author = d.author || "anonymous";
        return {
          id: d.id,
          author,
          snippet: (d.title || "").slice(0, 240) + (d.selftext ? " · " + d.selftext.slice(0, 140) : ""),
          url: d.url_overridden_by_dest || `https://www.reddit.com${d.permalink}`,
          permalink: `https://www.reddit.com${d.permalink}`,
          score: d.score ?? 0,
          comments: d.num_comments ?? 0,
          ageMs,
          ageLabel: relativeTime(new Date(d.created_utc * 1000).toISOString()),
          // Verified = the post was distinguished (mod-pinned) OR has high score OR mod-flair.
          verified: Boolean(d.distinguished) || (d.score ?? 0) > 500 || Boolean(d.link_flair_text),
          source: "reddit" as const,
          subreddit: d.subreddit_name_prefixed,
        };
      });
    if (items.length === 0) return mockPosts(symbol, limit);
    return items;
  } catch {
    return mockPosts(symbol, limit);
  }
}

/**
 * Deterministic mock used when Reddit blocks us or returns empty.
 * Clearly labelled "mock" in the rendered UI.
 */
function mockPosts(symbol: string, limit: number): SocialPost[] {
  const coin = getCoin(symbol);
  if (!coin) return [];
  const seed = coin.coingeckoId;
  const baseAuthors = ["0xWhaleWatcher", "chartwizard", "defi_research", "satoshi_fan", "chain_analyst", "macro_maxi", "onchain_owl"];
  const baseSubs = ["r/CryptoCurrency", "r/CryptoMarkets", `r/${symbol.toUpperCase()}`];
  const out: SocialPost[] = [];
  for (let i = 0; i < limit; i++) {
    const h = hashString(seed + ":" + i);
    const author = baseAuthors[h % baseAuthors.length];
    const sub = baseSubs[h % baseSubs.length];
    const ageH = (h % 96) + 2;
    const ageMs = ageH * 3_600_000;
    const score = 50 + (h % 1450);
    out.push({
      id: `mock-${symbol}-${i}`,
      author,
      snippet: pickFlavor(seed, i),
      url: "#",
      permalink: "#",
      score,
      comments: Math.floor(score / 8),
      ageMs,
      ageLabel: relativeTime(new Date(Date.now() - ageMs).toISOString()),
      verified: score > 800 || h % 7 === 0,
      source: "mock",
      subreddit: sub,
    });
  }
  return out;
}