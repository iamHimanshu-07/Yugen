/**
 * news.ts — Server-side fetchers for crypto news.
 *
 * Uses CryptoPanic free tier (no key for basic access, but limited).
 * Falls back to RSS feeds if CryptoPanic unavailable.
 *
 * Endpoints:
 *   GET https://cryptopanic.com/api/v1/posts/ — public feed (limited)
 *   RSS: Cointelegraph, CoinDesk, The Block, Decrypt
 */

import { withRateLimit, tryWithRateLimit } from "./rate-limit";
import { Caches } from "./cache";

const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1";
const REVALIDATE_SECONDS = 300;

// ---------- Types -----------------------------------------------------------

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;      // ISO string
  currencies?: string[];    // e.g., ["BTC", "ETH"]
  kind?: "news" | "media" | "analysis";
  domain?: string;
}

// ---------- RSS feed URLs (fallback) ----------------------------------------

const RSS_FEEDS = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", domain: "coindesk.com" },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", domain: "cointelegraph.com" },
  { name: "The Block", url: "https://www.theblock.co/rss.xml", domain: "theblock.co" },
  { name: "Decrypt", url: "https://decrypt.co/feed", domain: "decrypt.co" },
  { name: "Bitcoin Magazine", url: "https://bitcoinmagazine.com/.rss/full/", domain: "bitcoinmagazine.com" },
];

// ---------- Cache keys ------------------------------------------------------

const NEWS_KEY = "cryptopanic:posts";
const RSS_KEY_PREFIX = "rss:";

// ---------- Helpers ---------------------------------------------------------

function parseRssDate(dateStr: string): Date {
  // RSS dates vary; try multiple formats
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

function parseRssItem(item: any, source: string, domain: string): NewsItem {
  return {
    id: `${domain}:${item.guid ?? item.link ?? Math.random().toString(36).slice(2)}`,
    title: item.title?.replace(/<[^>]+>/g, "") ?? "Untitled",
    url: item.link ?? "#",
    source,
    publishedAt: parseRssDate(item.pubDate ?? item.published ?? item.updated ?? "").toISOString(),
    domain,
  };
}

async function fetchRssFeed(url: string, source: string, domain: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/xml, text/xml", "User-Agent": "yugen/1.0" },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const text = await res.text();

    // Simple XML parsing for RSS items (no external dep)
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(text)) !== null && items.length < 20) {
      const itemXml = match[1];
      const getTag = (tag: string) => {
        const m = itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return m ? m[1] : "";
      };
      const item = {
        title: getTag("title"),
        link: getTag("link"),
        pubDate: getTag("pubDate"),
        published: getTag("published"),
        updated: getTag("updated"),
        guid: getTag("guid"),
      };
      items.push(parseRssItem(item, source, domain));
    }
    return items;
  } catch {
    return [];
  }
}

// ---------- Public API ------------------------------------------------------

/**
 * Fetch latest posts from CryptoPanic public API.
 * Returns normalized NewsItem array.
 */
export async function fetchCryptoPanicNews(limit = 20): Promise<NewsItem[]> {
  const cached = Caches.news.get(NEWS_KEY);
  if (cached) return cached.slice(0, limit);

  const url = `${CRYPTOPANIC_BASE}/posts/?public=true&filter=hot`;

  try {
    const data = await withRateLimit("cryptopanic", async () => {
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "yugen/1.0" },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`CryptoPanic ${res.status}`);
      return (await res.json()) as { results: any[] };
    });

    const items: NewsItem[] = (data.results ?? []).slice(0, limit).map((p) => ({
      id: `cp:${p.id}`,
      title: p.title,
      url: p.url,
      source: p.domain ?? "CryptoPanic",
      publishedAt: p.published_at,
      currencies: p.currencies?.map((c: any) => c.code) ?? [],
      kind: p.kind,
      domain: p.domain,
    }));

    Caches.news.set(NEWS_KEY, items);
    return items;
  } catch {
    // Fall through to RSS fallback
    return fetchRssFallback(limit);
  }
}

/**
 * Fallback: aggregate multiple RSS feeds.
 * Used when CryptoPanic is unavailable or rate limited.
 */
export async function fetchRssFallback(limit = 20): Promise<NewsItem[]> {
  const cacheKey = `${RSS_KEY_PREFIX}all`;
  const cached = Caches.news.get(cacheKey);
  if (cached) return cached.slice(0, limit);

  const allItems: NewsItem[] = [];

  // Fetch all feeds in parallel
  const results = await Promise.all(
    RSS_FEEDS.map((feed) => fetchRssFeed(feed.url, feed.name, feed.domain)),
  );

  for (const items of results) {
    allItems.push(...items);
  }

  // Sort by date desc, dedupe by title similarity
  const sorted = allItems
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .filter((item, idx, arr) =>
      idx === 0 || !arr[idx - 1].title.toLowerCase().includes(item.title.toLowerCase().slice(0, 30)),
    );

  Caches.news.set(cacheKey, sorted);
  return sorted.slice(0, limit);
}

/**
 * Main entry: try CryptoPanic, fall back to RSS.
 * Returns up to `limit` news items.
 */
export async function fetchNews(limit = 20): Promise<NewsItem[]> {
  // Try CryptoPanic first (faster, richer data)
  const cpResult = await tryWithRateLimit("cryptopanic", () => fetchCryptoPanicNews(limit));
  if (cpResult && cpResult.length > 0) return cpResult;

  // Fallback to RSS
  return fetchRssFallback(limit);
}

/**
 * Fetch news filtered by currency symbols (e.g., ["BTC", "ETH"]).
 * Uses CryptoPanic's currency filtering when available.
 */
export async function fetchNewsForCurrencies(currencies: string[], limit = 15): Promise<NewsItem[]> {
  const allNews = await fetchNews(50);
  const currencySet = new Set(currencies.map((c) => c.toUpperCase()));

  return allNews
    .filter((item) => item.currencies?.some((c) => currencySet.has(c.toUpperCase())))
    .slice(0, limit);
}