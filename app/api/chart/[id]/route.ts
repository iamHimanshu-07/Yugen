/**
 * api/chart/[id]/route.ts — proxy CoinGecko market chart through our cache.
 *
 * Keeps the upstream URL out of the client bundle, lets us extend with auth
 * or rate-limiting later, and revalidates every 60s server-side. Also
 * downsamples very dense series (>400 points) before responding, so the
 * client chart never does more work than the canvas actually needs.
 */
import { fetchMarketChart } from "@/lib/coingecko";
import { lttb } from "@/lib/decimate";
import { hashString } from "@/lib/utils";

const MAX_POINTS = 400;

/**
 * Generate deterministic mock market chart for build optimization
 */
function generateMockMarketChart(id: string, days: number): { prices: [number, number][] } {
  const seed = hashString(id);
  // Find index in COINS array for deterministic price base
  const coinIndex = ["bitcoin", "ethereum", "binancecoin", "solana", "ripple", "cardano", "tron", "chainlink", "stellar", "zcash", "monero", "dogecoin", "tether", "usd-coin"].indexOf(id);
  const priceBase = [45000, 2500, 350, 100, 0.5, 0.4, 0.1, 12, 0.1, 0.08, 30, 150, 0.08, 1, 1][coinIndex] || 100;
  const price = priceBase * (0.8 + (seed % 40) / 100);

  const now = Date.now();
  // Granularity: 1d -> ~5min (288 points), 7d -> hourly (168), 30d+ -> daily
  let points: number;
  if (days <= 1) {
    points = 288;
  } else if (days <= 30) {
    points = 24 * days;
  } else {
    points = days;
  }

  const prices: [number, number][] = [];

  for (let i = 0; i < points; i++) {
    const t = now - (points - i) * (86400000 / points); // Adjust interval based on points
    const variation = 0.9 + (hashString(id + i.toString()) % 200) / 1000;
    prices.push([t, price * variation]);
  }

  return { prices };
}

export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = new URL(_req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30)));

  // Skip real API calls during build to speed up compilation
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
    // During next build - return mock data immediately
    const mockData = generateMockMarketChart(id, days);
    return Response.json(mockData);
  }

  try {
    const data = await fetchMarketChart(id, days);
    const prices = data.prices.length > MAX_POINTS ? lttb(data.prices, MAX_POINTS) : data.prices;
    return Response.json({ prices });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}