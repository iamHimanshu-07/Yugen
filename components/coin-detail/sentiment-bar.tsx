/**
 * sentiment-bar.tsx — server component, renders the sentiment card.
 *
 * Accepts the RealSentiment shape (which is a superset of Sentiment) so
 * we can label the source pill correctly: "OPEN DATA" when real data is
 * available, "MOCK" when falling back to the deterministic mock.
 */
import { fmtInt } from "@/lib/utils";
import type { RealSentiment } from "@/lib/sentiment-real";

export function SentimentBar({ sentiment }: { sentiment: RealSentiment }) {
  const bull = sentiment.bullishPercent;
  const bear = 100 - bull;
  const isReal = sentiment.source === "cryptopanic";
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>Community sentiment</div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
            <span className="src-pill" style={{ marginRight: 8 }}>{isReal ? "OPEN DATA" : "MOCK"}</span>
            {isReal ? "CryptoPanic · " : "Community signal · "}Last 7 days · {fmtInt(sentiment.totalVotes)} {isReal ? "headlines" : "votes"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, color: "var(--bull)", letterSpacing: "-0.02em", lineHeight: 1 }}>
            {bull.toFixed(0)}%
          </div>
          <div style={{ color: "var(--muted)", fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Bullish</div>
        </div>
      </div>

      <div className="sentiment-bar" style={{ marginTop: 18 }}>
        <div className="fill-bull" style={{ width: `${bull}%` }} />
        <div className="fill-bear" style={{ width: `${bear}%` }} />
      </div>
      <div className="sentiment-legend">
        <span style={{ color: "var(--bull)", fontWeight: 700 }}>▲ {fmtInt(sentiment.bullishVotes)} bullish</span>
        <span style={{ color: "var(--bear)", fontWeight: 700 }}>{fmtInt(sentiment.bearishVotes)} bearish ▼</span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, color: "var(--bull)", borderColor: "rgba(22,199,132,0.45)" }}>
          ▲ Bullish
        </button>
        <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, color: "var(--bear)", borderColor: "rgba(234,57,67,0.45)" }}>
          ▼ Bearish
        </button>
      </div>
      <div style={{ marginTop: 12, textAlign: "center" }}>
        <a href="#" style={{ color: "var(--muted)", fontSize: 12, textDecoration: "none" }}>
          See more →
        </a>
      </div>
    </div>
  );
}