/**
 * app/api/news/route.ts — Aggregated crypto news endpoint.
 *
 * Query params:
 *   limit: number (default 20, max 50)
 *   currencies: comma-separated (e.g., "BTC,ETH") — filter by currency
 *
 * Returns news items from CryptoPanic + RSS fallback.
 * Cached 5 min server-side.
 */

import { fetchNews, fetchNewsForCurrencies } from "@/lib/news";

export const revalidate = 300;

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const currenciesParam = url.searchParams.get("currencies");

  try {
    let items;
    if (currenciesParam) {
      const currencies = currenciesParam.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
      items = await fetchNewsForCurrencies(currencies, limit);
    } else {
      items = await fetchNews(limit);
    }

    return Response.json({ items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}