/**
 * app/api/news/route.ts — Aggregated crypto news endpoint.
 *
 * Query params:
 *   limit: number (default 20, max 100)
 *   offset: number (default 0) — for pagination
 *   currencies: comma-separated (e.g., "BTC,ETH") — filter by currency
 *
 * Returns news items from CryptoPanic + RSS fallback.
 * Cached 5 min server-side.
 */

import { fetchNews, fetchNewsForCurrencies } from "@/lib/news";

export const revalidate = 300;

export async function GET(_req: Request) {
  const url = new URL(_req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const currenciesParam = url.searchParams.get("currencies");

  try {
    let items;
    if (currenciesParam) {
      const currencies = currenciesParam.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
      items = await fetchNewsForCurrencies(currencies, limit + offset); // fetch extra to slice
    } else {
      items = await fetchNews(limit + offset);
    }

    // Slice for pagination
    const paginated = items.slice(offset, offset + limit);

    return Response.json({ items: paginated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}