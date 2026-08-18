/**
 * catalog-grid.tsx — client component holding search / kind-filter / sort state.
 * Renders the responsive grid of CoinCard components.
 */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmtBigUSD, fmtPct, fmtUSD, fmtInt, pctColor } from "@/lib/utils";

/**
 * Check if data is considered "live" (updated within the last 2 minutes)
 */
function isLiveData(timestampString: string): boolean {
  if (!timestampString) return false;
  const lastUpdated = new Date(timestampString).getTime();
  const now = Date.now();
  // Consider data live if updated within the last 2 minutes (120000ms)
  return (now - lastUpdated) < 120000;
}

export interface CatalogItem {
  symbol: string;
  name: string;
  glyph: string;
  color: string;
  coingeckoId: string;
  kind: string;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  marketCapRank: number | null;
  high24h: number | null;
  low24h: number | null;
  priceChangePercentage7d: number | null;
  priceChangePercentage30d: number | null;
  priceChangePercentage1y: number | null;
  circulatingSupply: number | null;
  sparkline: number[];
  lastUpdated: string | null;
}

type KindFilter = "All" | "L1" | "Stable" | "Privacy" | "Meme";
type SortKey = "rank" | "change" | "price" | "cap";

export function CatalogGrid({ items }: { items: CatalogItem[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<KindFilter>("All");
  const [sort, setSort] = useState<SortKey>("rank");

  const filtered = useMemo(() => {
    let out = items;
    if (kind !== "All") out = out.filter((i) => i.kind === kind.toLowerCase());
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      out = out.filter(
        (i) => i.name.toLowerCase().includes(t) || i.symbol.toLowerCase().includes(t) || i.coingeckoId.includes(t),
      );
    }
    out = [...out];
    if (sort === "change") {
      out.sort((a, b) => (b.change24h ?? -Infinity) - (a.change24h ?? -Infinity));
    } else if (sort === "price") {
      out.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === "cap") {
      out.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));
    }
    return out;
  }, [items, q, kind, sort]);

  return (
    <>
      {/* Filter bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 28,
          padding: "12px 14px",
          borderRadius: 14,
          background: "var(--panel)",
          border: "1px solid var(--border)",
        }}
      >
        <input
          type="text"
          placeholder="Filter by name or symbol…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Filter coins"
          style={{
            flex: "1 1 220px",
            minWidth: 200,
            height: 36,
            padding: "0 12px",
            borderRadius: 10,
            background: "var(--panel-2)",
            border: "1px solid var(--border-strong)",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(["All", "L1", "Stable", "Privacy", "Meme"] as KindFilter[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`range-tab ${kind === k ? "active" : ""}`}
              style={{ height: 32 }}
            >
              {k}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort by"
            style={{
              height: 36,
              padding: "0 10px",
              borderRadius: 10,
              background: "var(--panel-2)",
              border: "1px solid var(--border-strong)",
              color: "var(--text)",
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="rank">Rank</option>
            <option value="change">24h change</option>
            <option value="price">Price</option>
            <option value="cap">Market cap</option>
          </select>
        </div>
        <div style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 12, fontWeight: 600 }}>
          {filtered.length} of {items.length}
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {filtered.map((c) => (
          <Link key={c.symbol} href={`/coin/${c.coingeckoId}`} className="coin-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                className="glyph"
                style={{
                  background: hexA(c.color, 0.14),
                  color: c.color,
                }}
              >
                {c.glyph}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="name">{c.name}</div>
                <div className="sym">
                  {c.symbol}
                  <span style={{ marginLeft: 8, color: "var(--dim)", fontWeight: 500 }}>· {c.kind.toUpperCase()}</span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`pill ${c.change24h == null ? "pill-neutral" : c.change24h >= 0 ? "pill-bull" : "pill-bear"}`}>
                  {fmtPct(c.change24h)}
                </span>
                {c.marketCapRank !== null && (
                  <span style={{ background: "var(--panel-2)", color: "var(--muted)", fontSize: 10, padding: "2px 6px", borderRadius: 4 }}>
                    #{c.marketCapRank}
                  </span>
                )}
              </div>
            </div>

            <div className="price mono">
              {c.price == null ? "—" : (
                c.price < 1 ? `$${c.price.toFixed(4)}` : `$${c.price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: c.price < 10 ? 4 : 2 })}`
              )}
            </div>

            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cap {fmtBigUSD(c.marketCap)}</span>
                <span>Vol {c.volume24h ? `${(c.volume24h / 1e9).toFixed(2)}B` : "—"}</span>
              </div>
              {c.high24h !== null && c.low24h !== null && (
                <div style={{ color: "var(--dim)", fontSize: 10 }}>
                  24h: {fmtUSD(c.low24h)} — {fmtUSD(c.high24h)}
                </div>
              )}
              {c.circulatingSupply !== null && (
                <div style={{ color: "var(--dim)", fontSize: 10 }}>
                  Circ {fmtInt(c.circulatingSupply)} {c.symbol.toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ marginTop: 10, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {c.priceChangePercentage7d !== null && (
                <span style={{ color: pctColor(c.priceChangePercentage7d), fontSize: 10 }}>
                  7d: {fmtPct(c.priceChangePercentage7d)}
                </span>
              )}
              {c.priceChangePercentage30d !== null && (
                <span style={{ color: pctColor(c.priceChangePercentage30d), fontSize: 10, marginLeft: 8 }}>
                  30d: {fmtPct(c.priceChangePercentage30d)}
                </span>
              )}
              {c.priceChangePercentage1y !== null && (
                <span style={{ color: pctColor(c.priceChangePercentage1y), fontSize: 10, marginLeft: 8 }}>
                  1y: {fmtPct(c.priceChangePercentage1y)}
                </span>
              )}
            </div>

            <div style={{ marginTop: 14, height: 56, borderRadius: 10, overflow: "hidden", background: "var(--panel-2)", position: "relative" }}>
              <Sparkline prices={c.sparkline} color={c.change24h != null && c.change24h < 0 ? "var(--bear)" : "var(--bull)"} />
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", color: "var(--dim)", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              <span>7d · {c.lastUpdated ? isLiveData(c.lastUpdated) ? 'live' : 'delayed' : '—'}</span>
              <span>Open →</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function hexA(hex: string, a: number) {
  // Convert #rrggbb to rgba(...)
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function Sparkline({ prices, color }: { prices: number[]; color: string }) {
  if (!prices || prices.length < 2) {
    return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dim)", fontSize: 11 }}>No history</div>;
  }
  const w = 260, h = 56;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const step = w / (prices.length - 1);
  const pts = prices.map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * (h - 4) - 2).toFixed(1)}`).join(" ");
  const areaPath = `M 0,${h} L ${pts} L ${w},${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="sparkgrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkgrad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}