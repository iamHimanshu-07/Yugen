/**
 * components/prediction/metrics-card.tsx — Model backtest metrics display.
 *
 * Shows MAE, RMSE, direction accuracy from walk-forward backtest.
 */

"use client";

import { fmtUSD, fmtPct } from "@/lib/utils";

interface MetricsCardProps {
  backtest?: {
    mae: number;
    rmse: number;
    directionAccuracy: number;
  };
  model: string;
}

export function MetricsCard({ backtest, model }: MetricsCardProps) {
  if (!backtest) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Backtest metrics unavailable for this model.</div>
      </div>
    );
  }

  const { mae, rmse, directionAccuracy } = backtest;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Backtest Metrics (30-day walk-forward)</h3>
        <span className="pill pill-muted" style={{ fontSize: 11 }}>{model}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {/* MAE */}
        <div style={{ textAlign: "center", padding: "16px 12px", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            MAE (Mean Abs Error)
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
            {fmtUSD(mae)}
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>
            Avg absolute prediction error
          </div>
        </div>

        {/* RMSE */}
        <div style={{ textAlign: "center", padding: "16px 12px", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            RMSE (Root Mean Sq Error)
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: "var(--text)" }}>
            {fmtUSD(rmse)}
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>
            Penalizes large errors more
          </div>
        </div>

        {/* Direction Accuracy */}
        <div style={{ textAlign: "center", padding: "16px 12px", background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>
            Direction Accuracy
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: directionAccuracy > 0.55 ? "var(--bull)" : directionAccuracy < 0.45 ? "var(--bear)" : "var(--text)" }}>
            {fmtPct(directionAccuracy * 100, false)}
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 4 }}>
            % of days with correct up/down
          </div>
        </div>
      </div>

      {/* Interpretation */}
      <div style={{ marginTop: 16, padding: 12, background: "rgba(255,106,26,0.08)", borderRadius: 8, border: "1px solid rgba(255,106,26,0.2)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>How to read this</div>
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.8, color: "var(--muted)" }}>
          <li><strong>MAE {fmtUSD(mae)}:</strong> On average, predictions miss by this much.</li>
          <li><strong>RMSE {fmtUSD(rmse)}:</strong> Larger errors are penalized; RMSE ≥ MAE.</li>
          <li><strong>Direction {fmtPct(directionAccuracy * 100, false)}:</strong> {directionAccuracy > 0.52 ? "Better than random" : directionAccuracy < 0.48 ? "Worse than random" : "Near random"}. Above 55% is considered useful for trading signals.</li>
        </ul>
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--dim)" }}>
          Walk-forward backtest: each day predicted using only prior data. Not financial advice.
        </div>
      </div>
    </div>
  );
}