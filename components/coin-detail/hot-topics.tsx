/**
 * hot-topics.tsx — mocked-but-styled "Hot topics" sidebar card.
 * Real implementation would hit CoinGecko /coins/{id}/status_updates.
 */
import { getCoin } from "@/lib/coins";
import { hashString } from "@/lib/utils";

interface Topic {
  tag: string;
  title: string;
  url: string;
}

const TEMPLATES: { tag: string; title: (s: string) => string }[] = [
  { tag: "REGULATION", title: (s) => `${s} spot ETF flows hit 3-week high` },
  { tag: "TECH",       title: (s) => `Core dev call signals next upgrade for ${s}` },
  { tag: "MARKETS",    title: (s) => `Whale wallet accumulates $42M of ${s} overnight` },
  { tag: "MINING",     title: (s) => `Hashrate prints new all-time high on ${s} network` },
  { tag: "POLITICS",   title: (s) => `Senator floats new framework for ${s} custody rules` },
];

export function HotTopics({ symbol }: { symbol: string }) {
  const coin = getCoin(symbol);
  if (!coin) return null;
  const seed = coin.coingeckoId;
  const topics: Topic[] = TEMPLATES.map((t, i) => ({
    tag: t.tag,
    title: t.title(coin.name),
    url: "#",
    _i: i,
    _h: hashString(seed + ":" + t.tag),
  } as Topic & { _i: number; _h: number }))
    .sort((a, b) => (a as any)._h - (b as any)._h)
    .slice(0, 4)
    .map(({ tag, title, url }) => ({ tag, title, url }));

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>Hot topics</div>
        <span className="src-pill" style={{ background: "rgba(138,147,166,0.12)", color: "var(--muted)", borderColor: "var(--border-strong)" }}>WEEK</span>
      </div>
      {topics.map((t, i) => (
        <a key={i} href={t.url} style={{ display: "block", padding: "12px 0", borderBottom: i === topics.length - 1 ? "none" : "1px solid var(--border)", textDecoration: "none", color: "inherit" }}>
          <span className="pill pill-muted" style={{ marginBottom: 6 }}>{t.tag}</span>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginTop: 4 }}>{t.title}</div>
        </a>
      ))}
    </div>
  );
}