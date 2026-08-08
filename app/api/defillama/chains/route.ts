/**
 * app/api/defillama/chains/route.ts — Proxy DefiLlama chains TVL list.
 *
 * Returns all chains with current TVL, sorted by TVL desc.
 * Cached 5 min server-side.
 */

import { fetchChainsTvl } from "@/lib/defillama";

export const revalidate = 300;

export async function GET() {
  try {
    const chains = await fetchChainsTvl();
    return Response.json({ chains });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}