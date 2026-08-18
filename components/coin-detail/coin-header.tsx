/**
 * coin-header.tsx — Shared header for /coin/[id] and all its sub-pages.
 *
 * Renders glyph + name + symbol + kind, source pill, last-updated timestamp,
 * the live price line and the 24h delta. Server component.
 */
import { fmtUSD, fmtPct, pctColor, relativeTime } from "@/lib/utils";

interface CoinHeaderProps {
  coin: {
    symbol: string;
    name: string;
    glyph: string;
    color: string;
    kind: string;
  };
  detail: any;
  error?: string | null;
}

export function CoinHeader({ coin, detail, error }: CoinHeaderProps) {
  const price = detail?.market_data?.current_price?.usd ?? null;
  const change24h = detail?.market_data?.price_change_percentage_24h ?? null;
  return (
    <header className="coin-header">
      <div className="id-block">
        <span
          className="glyph-lg"
          style={{ background: hexA(coin.color, 0.16), color: coin.color }}
        >
          {coin.glyph}
        </span>
        <div>
          <h1 className="font-display" style={{ margin: 0 }}>
            {coin.name}{" "}
            <span
              style={{
                color: "var(--muted)",
                fontWeight: 700,
                fontSize: "0.55em",
                letterSpacing: "0.06em",
                verticalAlign: "middle",
              }}
            >
              {coin.symbol} · {coin.kind.toUpperCase()}
            </span>
          </h1>
          <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="src-pill">COINGECKO</span>
            <span
              className="src-pill"
              style={{
                background: "rgba(22,199,132,0.14)",
                color: "var(--bull)",
                borderColor: "rgba(22,199,132,0.45)",
              }}
            >
              LIVE
            </span>
            {detail && (
              <span
                style={{
                  color: "var(--dim)",
                  fontSize: 12,
                  fontWeight: 600,
                  alignSelf: "center",
                  marginLeft: 4,
                }}
              >
                Updated {relativeTime(detail.last_updated)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="price-line">
        <div className="price-now mono">
          {price != null ? fmtUSD(price, price < 1 ? 4 : 2) : "—"}
        </div>
        <div className={`price-change ${pctColor(change24h)}`}>
          {fmtPct(change24h)} · 24h
        </div>
        {error && (
          <div
            style={{
              marginTop: 10,
              color: "var(--bear)",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            ! Live data unavailable
          </div>
        )}
      </div>
    </header>
  );
}

function hexA(hex: string, a: number) {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}