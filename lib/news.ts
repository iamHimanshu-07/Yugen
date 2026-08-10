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
import { hashString } from "./utils";

const CRYPTOPANIC_BASE = "https://cryptopanic.com/api/v1";
const REVALIDATE_SECONDS = 300;

/**
 * Check if we're running in a local development environment.
 * In production (Vercel), this will be false and real API calls will be made.
 */
function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== "production";
}

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
  try {
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
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[news] fetchRssFallback failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockNews(limit);
    }
    throw error;
  }
}

/**
 * Main entry: try CryptoPanic, fall back to RSS.
 * Returns up to `limit` news items.
 */
export async function fetchNews(limit = 20): Promise<NewsItem[]> {
  try {
    // Try CryptoPanic first (faster, richer data)
    const cpResult = await tryWithRateLimit("cryptopanic", () => fetchCryptoPanicNews(limit));
    if (cpResult && cpResult.length > 0) return cpResult;

    // Fallback to RSS
    return fetchRssFallback(limit);
  } catch (error) {
    if (isLocalDev()) {
      console.warn("[news] fetchNews failed, using mock:", error instanceof Error ? error.message : String(error));
      return generateMockNews(limit);
    }
    throw error;
  }
}

/**
 * Fetch news filtered by currency symbols (e.g., ["BTC", "ETH"]).
 * Uses CryptoPanic's currency filtering when available.
 */
export async function fetchNewsForCurrencies(currencies: string[], limit = 15): Promise<NewsItem[]> {
  try {
    const allNews = await fetchNews(50);
    const currencySet = new Set(currencies.map((c) => c.toUpperCase()));

    return allNews
      .filter((item) => item.currencies?.some((c) => currencySet.has(c.toUpperCase())))
      .slice(0, limit);
  } catch (error) {
    if (isLocalDev()) {
      console.warn(`[news] fetchNewsForCurrencies failed, using mock:`, error instanceof Error ? error.message : String(error));
      return generateMockNews(limit);
    }
    throw error;
  }
}

// ---------- Local Development Mocks ------------------------------------------

/**
 * Generate deterministic mock news items for local development.
 */
function generateMockNews(limit = 20): NewsItem[] {
  const now = Date.now();
  const sources = [
    { name: "CoinDesk", domain: "coindesk.com" },
    { name: "Cointelegraph", domain: "cointelegraph.com" },
    { name: "The Block", domain: "theblock.co" },
    { name: "Decrypt", domain: "decrypt.co" },
    { name: "Bitcoin Magazine", domain: "bitcoinmagazine.com" },
    { name: "CryptoPanic", domain: "cryptopanic.com" },
  ];

  const headlines = [
    "Bitcoin Surges Past $65K as Institutional Adoption Accelerates",
    "Ethereum Gas Fees Drop 40% After Latest Network Upgrade",
    "Solana TVL Reaches New All-Time High at $8B",
    "Cardano Completes Vasil Hard Fork Successfully",
    "XRP Wins Partial Victory in SEC Lawsuit Appeal",
    "Dogecoin Foundation Announces New Development Fund",
    "Tether Issues Additional $1B in USDT on Tron Network",
    "USD Coin Circulating Supply Hits $50 Billion Milestone",
    "Binance Smart Chain Sees Record Daily Transaction Volume",
    "Polkadot Parachain Auctions Generate $2B in Crowdloans",
    "Avalanche Subnets Enable Custom Blockchain Deployments",
    "Chainlink Integrates with 50+ New Data Providers",
    "Uniswap V4 Hooks Enable Advanced AMM Strategies",
    "Compound Governance Approves Treasury Diversification",
    "MakerDAO Increases DAI Savings Rate to 4%",
    "SushiSwap Launches Cross-Chain Bridge Initiative",
    "Curve Finance Adds New Stablecoin Pools",
    "Yearn Finance Vaults Surpass $10B in Total Value Locked",
    "Shiba Inu Developers Announce Shibarium Mainnet Date",
    "Litecoin Halving Countdown Begins: 90 Days to Block Reward Cut"
  ];

  const summaries = [
    "Trading volume increased 25% week-over-week as new ETF approvals boosted market sentiment.",
    "Developers report improved scalability and lower transaction costs for end users.",
    "The growth reflects expanding ecosystem of DeFi and NFT projects on the blockchain.",
    "Network upgrade introduces improved smart contract capabilities and staking rewards.",
    "Legal experts view the ruling as a positive step toward regulatory clarity for the asset.",
    "Fund will support core protocol development and community grant programs.",
    "Expansion aims to increase stablecoin accessibility in Asian and Latin American markets.",
    "Growth driven by institutional adoption and cross-chain interoperability initiatives.",
    "Network congestion relief measures implemented ahead of anticipated bull market season.",
    "Winning bids highlight strong developer interest in Polkadot's interoperability framework.",
    "Developers can now launch application-specific blockchains with customizable economics.",
    "New integrations expand oracle coverage for pricing, weather, and random data feeds.",
    "Hook system allows developers to customize liquidity pool behavior without forking core.",
    "Protocol adjusts risk parameters to accommodate evolving market conditions and collateral types.",
    "Adjustment aims to increase stablecoin attractiveness relative to traditional savings accounts.",
    "Proposal receives broad community support for expanding yield-generating strategies.",
    "New AMM design reduces slippage for large-volume stablecoin swaps.",
    "Bridge enables trustless asset transfers between EVM-compatible networks.",
    "Vault performance continues to outperform benchmark indices across multiple timeframes.",
    "Layer 2 solution promises faster transactions and lower fees for meme token ecosystem.",
    "Miners prepare for reduced block rewards while exploring alternative revenue streams."
  ];

  const kinds = ["news", "analysis", "media"];

  const items: NewsItem[] = [];
  for (let i = 0; i < limit; i++) {
    const sourceIdx = i % sources.length;
    const headlineIdx = i % headlines.length;
    const summaryIdx = i % summaries.length;
    const kindIdx = i % kinds.length;

    const hoursAgo = (i * 3) % 48; // Spread over last 48 hours
    const publishedAt = new Date(now - hoursAgo * 3600000).toISOString();

    // Deterministic but varied currency tags based on hash
    const seed = hashString(`news:${i}`);
    const currencyOptions = [["BTC"], ["ETH"], ["SOL"], ["ADA"], ["XRP"], ["DOGE"], ["USDT"], ["USDC"], ["BNB"], ["DOT"], ["AVAX"], ["LINK"]];
    const currencies = currencyOptions[seed % currencyOptions.length];

    items.push({
      id: `mock-news-${i}`,
      title: `${headlines[headlineIdx]} - ${sources[sourceIdx].name}`,
      url: `https://${sources[sourceIdx].domain}/news/${i}`,
      source: sources[sourceIdx].name,
      publishedAt,
      currencies,
      kind: kinds[kindIdx] as "news" | "media" | "analysis",
      domain: sources[sourceIdx].domain,
    });
  }

  return items;
}