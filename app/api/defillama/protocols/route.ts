/**
 * app/api/defillama/protocols/route.ts — Proxy DefiLlama protocols list.
 *
 * Query params:
 *   limit: number (default 50, max 200)
 *   chain: string (optional) — filter by chain
 *   category: string (optional) — filter by category (dex, lending, etc.)
 *
 * Returns top protocols by TVL.
 * Cached 5 min server-side.
 */

import { fetchProtocols } from "@/lib/defillama";

export const revalidate = 300;

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 50)));
  const chain = url.searchParams.get("chain") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;

  try {
    let protocols = await fetchProtocols(limit);

    if (chain) {
      protocols = protocols.filter((p) =>
        p.chains.map((c) => c.toLowerCase()).includes(chain.toLowerCase()),
      );
    }
    if (category) {
      protocols = protocols.filter((p) =>
        p.category.toLowerCase() === category.toLowerCase(),
      );
    }

    // Return minimal shape for UI
    const items = protocols.slice(0, limit).map((p) => ({
      id: p.id,
      name: p.name,
      symbol: p.symbol,
      chain: p.chain,
      category: p.category,
      tvl: p.tvl,
      change_1d: p.change_1d,
      change_7d: p.change_7d,
      url: p.url,
      logo: p.logo,
    }));

    return Response.json({ protocols: items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}