/**
 * api/chart/[id]/route.ts — proxy CoinGecko market chart through our cache.
 *
 * Keeps the upstream URL out of the client bundle, lets us extend with auth
 * or rate-limiting later, and revalidates every 60s server-side.
 */
import { fetchMarketChart } from "@/lib/coingecko";

export const revalidate = 60;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const url = new URL(_req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30)));

  try {
    const data = await fetchMarketChart(id, days);
    return Response.json({ prices: data.prices });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}