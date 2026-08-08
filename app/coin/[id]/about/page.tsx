/**
 * /coin/[id]/about — Full description + website/reddit/twitter links +
 * CoinGecko categories for the coin.
 */
import { notFound } from "next/navigation";
import { fetchCoinDetail } from "@/lib/coingecko";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { CoinHeader } from "@/components/coin-detail/coin-header";
import { TabStrip } from "@/components/coin-detail/tab-strip";

export const revalidate = 3600;

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) return {};
  return {
    title: `About ${coin.name} — what it is and how it works · Yugen`,
    description: `${coin.name} (${coin.symbol}) — what it is, links to the project site, community channels, and CoinGecko categories.`,
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) notFound();

  let detail: any = null;
  let loadError: string | null = null;
  try {
    detail = await fetchCoinDetail(id);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load about data";
  }

  const description = detail?.description?.en
    ? stripHtml(detail.description.en)
    : `Live data for ${coin.name} (${coin.symbol}) — pulled directly from CoinGecko and rendered server-side. No scraping, no delays.`;

  return (
    <>
      <CoinHeader coin={coin} detail={detail} error={loadError} />
      <TabStrip basePath={`/coin/${id}`} />

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div className="card">
          <div
            style={{
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: "-0.02em",
            }}
          >
            About {coin.name}
          </div>
          <div
            style={{
              color: "var(--muted)",
              fontSize: 14,
              lineHeight: 1.7,
              marginTop: 14,
              whiteSpace: "pre-wrap",
            }}
          >
            {description}
          </div>

          {(detail?.links?.homepage?.[0] ||
            detail?.links?.subreddit_url ||
            detail?.links?.twitter_screen_name) && (
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 18,
                flexWrap: "wrap",
                fontSize: 13,
              }}
            >
              {detail?.links?.homepage?.[0] && (
                <a
                  href={detail.links.homepage[0]}
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Website ↗
                </a>
              )}
              {detail?.links?.subreddit_url && (
                <a
                  href={detail.links.subreddit_url}
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Reddit ↗
                </a>
              )}
              {detail?.links?.twitter_screen_name && (
                <a
                  href={`https://twitter.com/${detail.links.twitter_screen_name}`}
                  target="_blank"
                  rel="noopener"
                  style={{
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Twitter ↗
                </a>
              )}
            </div>
          )}

          {detail?.categories && detail.categories.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 18,
                flexWrap: "wrap",
              }}
            >
              {detail.categories.slice(0, 8).map((cat: string) => (
                <span key={cat} className="pill pill-muted">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}