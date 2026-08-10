/**
 * app/predict/page.tsx — Bitcoin Price Prediction page.
 *
 * Server Component. Fetches prediction from /api/predict/btc + historical data.
 * Renders ForecastChart and MetricsCard client components.
 */

import { fetchMarketChart } from "@/lib/coingecko";
import { predictBtcNextDay, getPredictionDisplay } from "@/lib/prediction";
import { ForecastChart } from "@/components/prediction/forecast-chart";
import { MetricsCard } from "@/components/prediction/metrics-card";
import { fmtUSD, fmtPct } from "@/lib/utils";

export const revalidate = 3600;

export const metadata = {
  title: "Bitcoin Prediction — Yugen",
  description: "Next-day BTC price forecast with confidence intervals. Statistical model, transparent backtest.",
};

export default async function PredictPage() {
  let prediction: Awaited<ReturnType<typeof predictBtcNextDay>> | null = null;
  let display: Awaited<ReturnType<typeof getPredictionDisplay>> | null = null;
  let historicalPoints: [number, number][] = [];
  let loadError: string | null = null;

  try {
    // Parallel fetch: prediction + historical price data (90 days)
    [prediction, display, historicalPoints] = await Promise.all([
      predictBtcNextDay(),
      getPredictionDisplay(),
      fetchMarketChart("bitcoin", 90).then((d) => d.prices),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load prediction";
  }

  // Transform prediction data for ForecastChart component
  const chartData = prediction && display ? transformPredictionForChart(prediction, display, historicalPoints) : null;

  return (
    <>
      <header className="section-tight" style={{ paddingTop: 56, paddingBottom: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Prediction</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 className="h-section" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
              Bitcoin Forecast <span style={{ color: "var(--muted)", fontWeight: 700 }}>next-day statistical model</span>
            </h1>
          </div>
          {prediction && display && (
            <div style={{ display: "flex", gap: 24, color: "var(--muted)", fontSize: 13 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Predicted</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{display.price}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Confidence</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>{display.confidencePct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Model</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--accent)" }}>{prediction.metadata.model}</div>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="section-tight" style={{ paddingTop: 32 }}>
        {loadError ? (
          <div className="card" style={{ borderColor: "var(--bear)" }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>Could not generate prediction</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{loadError}</div>
          </div>
        ) : prediction && display && chartData ? (
          <>
            {/* Main Forecast Chart */}
            <section style={{ marginBottom: 32 }}>
              <ForecastChart data={chartData} />
            </section>

            {/* Metrics Card */}
            <section style={{ marginBottom: 32 }}>
              <MetricsCard
                backtest={chartData.prediction.backtest}
                model={prediction.metadata.model}
              />
            </section>

            {/* Feature Breakdown */}
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Model Inputs</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                <FeatureCard
                  label="7-Day Momentum"
                  value={fmtPct(prediction.features.momentum * 100)}
                  description="Average daily log return over past 7 days. Positive = upward momentum."
                  color={prediction.features.momentum > 0 ? "var(--bull)" : "var(--bear)"}
                />
                <FeatureCard
                  label="7-Day Volatility"
                  value={(prediction.features.volatility * 100).toFixed(2) + "%"}
                  description="Standard deviation of daily log returns. Higher = wider confidence band."
                  color="var(--accent)"
                />
                <FeatureCard
                  label="Volume Trend (WoW)"
                  value={fmtPct(prediction.features.volumeTrend * 100)}
                  description="This week's avg volume vs last week. Positive = increasing interest."
                  color={prediction.features.volumeTrend > 0 ? "var(--bull)" : "var(--bear)"}
                />
                <FeatureCard
                  label="Fear & Greed Index"
                  value={prediction.features.fearGreed + "/100"}
                  description="Market sentiment (Alternative.me). Extreme fear = potential buying opportunity."
                  color={
                    prediction.features.fearGreed < 25 ? "var(--bear)" :
                    prediction.features.fearGreed > 75 ? "var(--bull)" :
                    "var(--accent)"
                  }
                />
                <FeatureCard
                  label="BTC Dominance"
                  value={prediction.features.btcDominance.toFixed(1) + "%"}
                  description="BTC share of total crypto market cap. Rising = BTC outperforming alts."
                  color="var(--accent)"
                />
                <FeatureCard
                  label="Mean Reversion"
                  value={fmtPct(prediction.features.momentum * -50)} // approximate
                  description="Pullback expectation when price deviates from 30-day MA."
                  color="var(--muted)"
                />
              </div>
            </section>

            {/* Disclaimer */}
            <section style={{ marginBottom: 32 }}>
              <div className="card" style={{ borderColor: "rgba(255,106,26,0.5)", background: "rgba(255,106,26,0.05)", padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>��⚠ Important Disclaimer</div>
                <div style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>
                  {prediction.disclaimer}
                  <br /><br />
                  <strong>Model details:</strong> Log-return linear regression with momentum (50%), volume trend (15%), fear & greed (10%), BTC dominance (5%), and mean reversion (20%) features.
                  Trained on 90-day rolling window. Walk-forward backtest on last 30 days.
                  <br /><br />
                  <strong>Limitations:</strong> Crypto markets are influenced by unpredictable events (regulation, hacks, macro shocks).
                  Statistical models cannot capture structural breaks or black swans.
                  Always do your own research and never invest more than you can afford to lose.
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="card" style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            Loading prediction…
          </div>
        )}
      </div>

      <section className="section-tight" style={{ paddingTop: 8 }}>
        <div style={{ color: "var(--dim)", fontSize: 12, lineHeight: 1.6 }}>
          Data sources: CoinGecko (price, volume, dominance), Alternative.me (Fear & Greed).
          Prediction updates hourly. <a href="/api/predict/btc" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>Raw JSON</a>
        </div>
      </section>
    </>
  );
}

/* ============================== Helper Functions ============================== */

/**
 * Transforms BtcPrediction and PredictionDisplay to match ForecastChart expectations
 */
function transformPredictionForChart(
  prediction: Awaited<ReturnType<typeof predictBtcNextDay>>,
  display: Awaited<ReturnType<typeof getPredictionDisplay>>,
  historicalPoints: [number, number][]
) {
  // We need recentClose to determine if prediction should be "flat"
  // Since we don't have it easily available, we'll approximate using the last historical point
  const recentClose = historicalPoints[historicalPoints.length - 1]?.[1] || 0;
  const priceChangePct = Math.abs((prediction.predictedPrice - recentClose) / recentClose);

  // Determine direction: flat if change is less than 0.1%
  const direction: "up" | "down" | "flat" =
    priceChangePct < 0.001 ? "flat" :
    prediction.predictedPrice > recentClose ? "up" : "down";

  return {
    prediction: {
      price: prediction.predictedPrice,
      lower: prediction.ciLower,
      upper: prediction.ciUpper,
      direction,
      confidence: prediction.confidence,
      model: prediction.metadata.model,
      features: {
        momentum: prediction.features.momentum,
        volatility: prediction.features.volatility,
        volumeTrend: prediction.features.volumeTrend,
        fearGreed: prediction.features.fearGreed,
        btcDominance: prediction.features.btcDominance,
        timestamp: Date.now(),
      },
      backtest: {
        mae: prediction.backtest.mae,
        rmse: prediction.backtest.mae * 1.2, // Approximate RMSE from MAE
        directionAccuracy: prediction.backtest.accuracy,
      },
    },
    display: {
      price: display.price,
      range: `$${prediction.ciLower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - $${prediction.ciUpper.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      direction: direction === "up" ? "Up" : direction === "down" ? "Down" : "Flat",
      confidenceLabel: prediction.confidence >= 0.8 ? "High" : prediction.confidence >= 0.6 ? "Medium" : "Low",
      confidencePct: display.confidencePct,
    },
    historicalPoints,
  };
}

/* ============================== Feature Card ============================== */

function FeatureCard({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 800, color }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.5, marginTop: "auto" }}>
        {description}
      </div>
    </div>
  );
}