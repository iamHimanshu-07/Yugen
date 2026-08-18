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
  console.log("[news] API called");
  console.log("[news] URL:", _req.url);

  try {
    // Test with hardcoded data first
    console.log("[news] Returning hardcoded test data");
    return Response.json({
      items: [{
        id: "test-1",
        title: "Test News Item",
        url: "https://example.com",
        source: "Test Source",
        publishedAt: new Date().toISOString()
      }]
    });

    /*
    console.log("[news] About to call fetchNews");
    const items = await fetchNews(100); // Get a bunch to slice from
    console.log("[news] fetchNews returned, items count:", items?.length ?? 0);

    const url = new URL(_req.url);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
    const currenciesParam = url.searchParams.get("currencies");

    let filteredItems = items;
    if (currenciesParam) {
      console.log("[news] Filtering by currencies:", currenciesParam);
      const currencies = currenciesParam.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
      const currencySet = new Set(currencies);
      filteredItems = items.filter((item) => item.currencies?.some((c) => currencySet.has(c.toUpperCase())));
      console.log("[news] After filtering, items count:", filteredItems.length);
    }

    // Slice for pagination
    const paginated = filteredItems.slice(offset, offset + limit);
    console.log("[news] Returning paginated count:", paginated.length, "from offset", offset, "limit", limit);

    return Response.json({ items: paginated });
    */
  } catch (e) {
    const msg = e instanceof Error ? e.message : "fetch failed";
    console.error("[news] error:", msg);
    if (e instanceof Error) {
      console.error("[news] error stack:", e.stack);
    }
    return Response.json({ error: msg }, { status: 502 });
  }
}