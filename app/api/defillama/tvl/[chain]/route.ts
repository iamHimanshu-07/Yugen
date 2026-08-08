/**
 * app/api/defillama/tvl/[chain]/route.ts — Proxy DefiLlama historical TVL for a chain.
 *
 * Query params:
 *   days: number (default 30, max 365) — how many days of history to return
 *
 * Returns daily TVL snapshots for the chain.
 * Cached 5 min server-side.
 */

import { fetchHistoricalChainTvl } from "@/lib/defillama";

export const revalidate = 300;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ chain: string }> },
) {
  const { chain } = await ctx.params;
  const url = new URL(_req.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") ?? 30)));

  try {
    // fetchHistoricalChainTvl trims server-side using its binary search.
    const data = await fetchHistoricalChainTvl(chain, days);

    // Return in format compatible with ECharts: [timestamp_ms, tvl]
    const points = data.map((d) => [d.date * 1000, d.tvl]);

    return Response.json({ chain, points, days });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}