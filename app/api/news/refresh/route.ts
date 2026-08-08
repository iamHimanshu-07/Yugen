/**
 * app/api/news/refresh/route.ts — Manual news cache refresh.
 *
 * POST /api/news/refresh
 *   - Clears the in-memory `Caches.news` (CryptoPanic + RSS keyspace).
 *   - Invalidates the Next.js data cache for the news pages so the next
 *     server render refetches from CryptoPanic / RSS.
 *
 * Returns { ok: true, cleared: { inMemory, revalidated } }.
 *
 * Why POST: it's a write (cache mutation + ISR invalidation), so a GET would
 * be wrong semantically. Refresh is rate-limited by the client (one click).
 */

import { revalidatePath } from "next/cache";
import { Caches } from "@/lib/cache";

const NEWS_PAGE_PATHS = [
  "/news",
  "/", // home page also surfaces news excerpts in some sections
];

export async function POST() {
  const inMemorySizeBefore = Caches.news.size;
  Caches.news.clear();
  const inMemoryCleared = inMemorySizeBefore;

  // Bust ISR for the static news pages.
  let revalidatedCount = 0;
  for (const path of NEWS_PAGE_PATHS) {
    try {
      revalidatePath(path);
      revalidatedCount++;
    } catch {
      // ignore — path may not exist in some envs
    }
  }

  return Response.json({
    ok: true,
    cleared: {
      inMemory: inMemoryCleared,
      revalidated: revalidatedCount,
    },
    at: new Date().toISOString(),
  });
}