/**
 * related-coins.tsx — "Related coins" sidebar mini-cards.
 * Excludes the current coin. Up to 4 cards.
 */
import Link from "next/link";
import { listCoins } from "@/lib/coins";
import { hashString } from "@/lib/utils";
import { fmtCompact } from "@/lib/utils";
import type { MarketRow } from "@/lib/coingecko";

export function RelatedCoins({
  currentId,
  rows,
}: {
  currentId: string;
  rows: MarketRow[];
}) {
  const others = listCoins()
    .filter((c) => c.coingeckoId !== currentId)
    // Stable order via hash so it doesn't shuffle between renders
    .sort((a, b) => hashString(a.coingeckoId) - hashString(b.coingeckoId))
    .slice(0, 4);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em" }}>Related coins</div>
        <Link href="/markets" style={{ color: "var(--muted)", fontSize: 12, textDecoration: "none" }}>All →</Link>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {others.map((c) => {
          const r = rows.find((row) => row.id === c.coingeckoId);
          return (
            <Link key={c.symbol} href={`/coin/${c.coingeckoId}`} className="mini-coin">
              <span
                className="glyph"
                style={{
                  background: hexA(c.color, 0.16),
                  color: c.color,
                }}
              >
                {c.glyph}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{c.name}</div>
                <div className="sym">{c.symbol} · cap {fmtCompact(r?.market_cap ?? null)}</div>
              </div>
              <div className="mono" style={{ fontSize: 12, color: (r?.price_change_percentage_24h ?? 0) >= 0 ? "var(--bull)" : "var(--bear)", fontWeight: 700 }}>
                {r?.price_change_percentage_24h != null
                  ? `${r.price_change_percentage_24h >= 0 ? "+" : ""}${r.price_change_percentage_24h.toFixed(2)}%`
                  : "—"}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function hexA(hex: string, a: number) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}