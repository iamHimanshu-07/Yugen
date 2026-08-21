/**
 * /compare — Multi-coin normalized price chart.
 *
 * Pick up to 3 coins and overlay their prices normalized to 100 at the start
 * of the selected range. Useful for "did BTC actually outperform ETH?" or
 * "is SOL catching up to BNB?" questions that the single-coin chart can't
 * answer.
 *
 * Server component for the page shell + initial data; coin picker and the
 * chart itself are client components so they can respond to selection.
 */
import { Suspense } from "react";
import type { Metadata } from "next";
import { listCoins } from "@/lib/coins";
import { CompareView } from "./compare-view";

export const metadata: Metadata = {
  title: "Compare — Yugen",
  description:
    "Overlay normalized price charts for up to 3 coins. Compare BTC, ETH, SOL and more on the same axes.",
};

export const revalidate = 60;

export default function ComparePage() {
  // Picklist: every catalog coin, plus the metadata the client needs to label
  // each series and link back to the per-coin dashboard.
  const picklist = listCoins().map((c) => ({
    coingeckoId: c.coingeckoId,
    symbol: c.symbol,
    name: c.name,
    color: c.color,
  }));

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px 24px 80px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Compare</div>
        <h1 className="h-section" style={{ fontSize: "clamp(28px, 3.6vw, 40px)" }}>
          Up to 3 coins. Normalized to 100.
        </h1>
        <p style={{ color: "var(--muted)", marginTop: 8, maxWidth: 720 }}>
          Each series starts at 100 at the beginning of the selected range, so
          coins with different price scales (think $60k BTC vs $0.08 DOGE) sit
          on the same axes. The number you read is percent change from the
          range start.
        </p>
      </div>

      {/* Suspense boundary required by useSearchParams() during prerender. */}
      <Suspense fallback={<div style={{ minHeight: 540 }} />}>
        <CompareView picklist={picklist} />
      </Suspense>
    </div>
  );
}
