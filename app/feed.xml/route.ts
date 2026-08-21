/**
 * app/feed.xml/route.ts — RSS 2.0 feed of the latest crypto headlines.
 *
 * Aggregates the same news fetchers the /news page uses (CryptoPanic → RSS
 * fallback) into a single feed users can subscribe to. Cached server-side
 * for 5 minutes, matching the news cache TTL.
 *
 * Subscribe URL: https://yugen-xi.vercel.app/feed.xml
 */

import { fetchNews } from "@/lib/news";

const SITE_URL = "https://yugen-xi.vercel.app";
const FEED_TITLE = "Yugen — Latest crypto news";
const FEED_DESCRIPTION =
  "Open-data crypto headlines, sourced from CryptoPanic and the top crypto RSS feeds. Updated every 5 minutes.";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const revalidate = 300;

export async function GET() {
  let items: Awaited<ReturnType<typeof fetchNews>> = [];
  try {
    items = await fetchNews(50);
  } catch {
    items = [];
  }

  const entries = items
    .slice(0, 30)
    .map((it) => {
      const link = escapeXml(it.url);
      const title = escapeXml(it.title);
      const guid = escapeXml(it.id);
      const pub = escapeXml(it.publishedAt);
      const source = escapeXml(it.source);
      const currencies = (it.currencies ?? []).map(escapeXml).join(", ");
      const desc = currencies
        ? `Source: ${source}. Tagged: ${currencies}.`
        : `Source: ${source}.`;
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pub}</pubDate>
      <source url="${SITE_URL}/about">${source}</source>
      <description>${escapeXml(desc)}</description>
    </item>`;
    })
    .join("\n");

  const lastBuild = escapeXml(new Date().toUTCString());
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
