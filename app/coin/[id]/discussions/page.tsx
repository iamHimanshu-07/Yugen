/**
 * /coin/[id]/discussions — Full social feed + Hot topics + community stats.
 *
 * Server component. Mirrors the right column of the legacy 3-column dashboard
 * — moved to its own page so the main /coin/[id] chart view stays focused.
 */
import { notFound } from "next/navigation";
import { fetchCoinDetail } from "@/lib/coingecko";
import { fetchSocialPosts } from "@/lib/reddit";
import { getCoinByGeckoId, listCoins } from "@/lib/coins";
import { fmtInt } from "@/lib/utils";
import { SocialFeed } from "@/components/coin-detail/social-feed";
import { HotTopics } from "@/components/coin-detail/hot-topics";
import { CoinHeader } from "@/components/coin-detail/coin-header";
import { TabStrip } from "@/components/coin-detail/tab-strip";

export const revalidate = 120;

export async function generateStaticParams() {
  return listCoins().map((c) => ({ id: c.coingeckoId }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) return {};
  return {
    title: `${coin.name} discussions — Reddit + hot topics · Yugen`,
    description: `Top Reddit threads, hot topics and community stats for ${coin.name}.`,
  };
}

export default async function DiscussionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coin = getCoinByGeckoId(id);
  if (!coin) notFound();

  let detail: any = null;
  let posts: Awaited<ReturnType<typeof fetchSocialPosts>> = [];
  let loadError: string | null = null;

  try {
    [detail, posts] = await Promise.all([
      fetchCoinDetail(id),
      fetchSocialPosts(coin.symbol, 15),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load discussions";
  }

  return (
    <>
      <CoinHeader coin={coin} detail={detail} error={loadError} />
      <TabStrip basePath={`/coin/${id}`} />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Hot topics + Community stats, side by side */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 16,
          }}
          className="md:grid-cols-1"
        >
          <HotTopics symbol={coin.symbol} />
          {detail && (
            <div className="card">
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.10em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                }}
              >
                Community
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 14,
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Twitter followers
                </span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {fmtInt(detail?.community_data?.twitter_followers)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Reddit subs
                </span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {fmtInt(detail?.community_data?.reddit_subscribers)}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 10,
                }}
              >
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  Active (48h)
                </span>
                <span className="mono" style={{ fontWeight: 700 }}>
                  {fmtInt(detail?.community_data?.reddit_accounts_active_48h)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Full social feed */}
        {posts.length > 0 ? (
          <SocialFeed posts={posts} />
        ) : (
          <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
            No posts available right now.
          </div>
        )}
      </div>
    </>
  );
}