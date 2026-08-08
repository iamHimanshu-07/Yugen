/**
 * short-feed.tsx — Compact "social signal" preview for the main /coin/[id] page.
 *
 * Server component. Shows the top 4 posts by score in a small card with a
 * "See all discussions" link to /coin/[id]/discussions.
 */
import Link from "next/link";
import { type SocialPost } from "@/lib/reddit";
import { fmtInt } from "@/lib/utils";

interface ShortFeedProps {
  posts: SocialPost[];
  coinId: string;
  usingMock?: boolean;
}

export function ShortFeed({ posts, coinId, usingMock }: ShortFeedProps) {
  const top = [...posts].sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <div className="card" style={{ padding: 0 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 22px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>
          Social signal
        </div>
        <Link
          href={`/coin/${coinId}/discussions`}
          style={{ color: "var(--muted)", fontSize: 12, textDecoration: "none" }}
        >
          See all discussions →
        </Link>
      </div>
      <div style={{ padding: "4px 22px 12px" }}>
        {top.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 13, padding: "16px 0" }}>
            {usingMock ? "Demo posts · Reddit egress unavailable" : "No posts yet."}
          </div>
        ) : (
          top.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target={p.url.startsWith("http") ? "_blank" : undefined}
              rel={p.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className="post"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="avatar">{p.author.charAt(0).toUpperCase()}</div>
              <div className="body">
                <div className="meta">
                  <span className="author">{p.author}</span>
                  <span>·</span>
                  <span>{p.subreddit}</span>
                  <span>·</span>
                  <span>{p.ageLabel}</span>
                </div>
                <div className="snippet">{p.snippet}</div>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    color: "var(--muted)",
                    fontSize: 11,
                    marginTop: 6,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  <span>▲ {fmtInt(p.score)}</span>
                  <span>💬 {fmtInt(p.comments)}</span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}