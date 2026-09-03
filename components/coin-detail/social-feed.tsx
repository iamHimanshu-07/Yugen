/**
 * social-feed.tsx — server component that renders the social list.
 * Tab strip (Top / Latest) is purely visual (both views share the same data —
 * Reddit's JSON `.json` returns the same shape, just different sort param).
 */
import { type SocialPost } from "@/lib/reddit";
import { fmtInt } from "@/lib/utils";

export function SocialFeed({ posts }: { posts: SocialPost[] }) {
  const top = [...posts].sort((a, b) => b.score - a.score);
  const latest = [...posts].sort((a, b) => a.ageMs - b.ageMs);
  const usingMock = posts[0]?.source === "mock";

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>Social feed</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
            {usingMock ? (
              <>
                <span className="src-pill" style={{ marginRight: 8, background: "rgba(138,147,166,0.12)", color: "var(--muted)", borderColor: "var(--border-strong)" }}>DEMO</span>
                Reddit · Last 7 days 
              </>
            ) : (
              <>
                <span className="src-pill" style={{ marginRight: 8 }}>LIVE · REDDIT</span>
                Top posts this week across {Array.from(new Set(posts.map((p) => p.subreddit))).slice(0, 3).join(", ")}
              </>
            )}
          </div>
        </div>
        <div className="tab-strip" style={{ marginBottom: 0, borderBottom: "none" }}>
          <button className="tab active">Top</button>
        </div>
      </div>
      <div style={{ padding: "8px 22px 16px" }}>
        {top.map((p) => (
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
                {p.verified && <span className="verified-badge" title="Verified">✓</span>}
                <span>·</span>
                <span>{p.subreddit}</span>
                <span>·</span>
                <span>{p.ageLabel}</span>
              </div>
              <div className="snippet">{p.snippet}</div>
              <div style={{ display: "flex", gap: 14, color: "var(--muted)", fontSize: 11, marginTop: 8, fontWeight: 600, letterSpacing: "0.04em" }}>
                <span>▲ {fmtInt(p.score)}</span>
                <span>💬 {fmtInt(p.comments)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}