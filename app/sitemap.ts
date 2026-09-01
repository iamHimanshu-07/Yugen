/**
 * sitemap.xml — emitted by Next.js at /sitemap.xml from this file.
 * Includes /, /markets, /about, and all 21 /coin/[id] routes.
 */
import type { MetadataRoute } from "next";
import { listCoins } from "@/lib/coins";

const SITE = "https://yugen-x.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const coins = listCoins().map((c) => ({
    url: `${SITE}/coin/${c.coingeckoId}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
  }));
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE}/markets`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...coins,
  ];
}