/**
 * price-chart.tsx — client component wrapping Apache ECharts.
 *
 * Receives a list of [timestamp_ms, price] points + the selected range label
 * and renders an interactive area chart with crosshair + tooltip.
 *
 * The chart re-fetches on range change via /api/chart/[id]?days=N which is
 * a Route Handler that proxies to CoinGecko with our server-side caching.
 */
"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { fmtPct, fmtUSD } from "@/lib/utils";

// ECharts is ~200KB gzipped — load only on the client.
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const RANGES = [
  { label: "24H", days: 1 },
  { label: "1W",  days: 7 },
  { label: "1M",  days: 30 },
  { label: "1Y",  days: 365 },
];

export interface PriceChartProps {
  coingeckoId: string;
  symbol: string;
  initialPoints: [number, number][];
  initialDays: number;
}

export function PriceChart({ coingeckoId, symbol, initialPoints, initialDays }: PriceChartProps) {
  const [active, setActive] = useState(initialDays);
  const [points, setPoints] = useState<[number, number][]>(initialPoints);
  const [pending, startTransition] = useTransition();

  // Re-fetch when the user picks a different range.
  useEffect(() => {
    if (active === initialDays) return;
    let aborted = false;
    (async () => {
      const res = await fetch(`/api/chart/${coingeckoId}?days=${active}`);
      if (!res.ok) return;
      const data = (await res.json()) as { prices: [number, number][] };
      if (aborted) return;
      startTransition(() => setPoints(data.prices));
    })();
    return () => {
      aborted = true;
    };
  }, [active, coingeckoId, initialDays]);

  const option = useMemo(() => buildOption(points, symbol), [points, symbol]);

  const first = points[0]?.[1] ?? 0;
  const last = points[points.length - 1]?.[1] ?? 0;
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>{symbol} · USD</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em" }}>
            {fmtUSD(last, last < 1 ? 4 : 2)}
          </div>
          <div style={{ marginTop: 4 }}>
            <span className={pct >= 0 ? "delta-up" : "delta-down"} style={{ fontWeight: 700, fontSize: 14 }}>
              {fmtPct(pct)} over range
            </span>
          </div>
        </div>
        <div className="range-tabs">
          {RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              className={`range-tab ${active === r.days ? "active" : ""}`}
              onClick={() => setActive(r.days)}
              disabled={pending}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ height: 380, position: "relative" }}>
        {pending && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13, zIndex: 2 }}>
            Loading…
          </div>
        )}
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge />
      </div>
    </div>
  );
}

function buildOption(points: [number, number][], symbol: string) {
  const xs = points.map(([t]) => t);
  const ys = points.map(([, p]) => p);
  const first = ys[0] ?? 0;
  const last = ys[ys.length - 1] ?? 0;
  const isUp = last >= first;
  const lineColor = isUp ? "#16C784" : "#EA3943";
  const areaColor = isUp ? "rgba(22,199,132,0.18)" : "rgba(234,57,67,0.18)";

  // Determine nice tick formatting based on span.
  const spanMs = xs.length > 1 ? xs[xs.length - 1] - xs[0] : 0;
  const day = 86_400_000;
  const dateFmt =
    spanMs <= day * 2 ? "HH:mm" :
    spanMs <= day * 14 ? "MMM d" :
    "MMM d";

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 56, right: 20, top: 16, bottom: 36 },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(17,20,27,0.96)",
      borderColor: "rgba(255,255,255,0.10)",
      borderWidth: 1,
      textStyle: { color: "#F5F7FA", fontFamily: "Inter, sans-serif", fontSize: 12 },
      padding: [8, 12],
      axisPointer: {
        type: "cross",
        lineStyle: { color: "rgba(255,106,26,0.45)", width: 1 },
        crossStyle: { color: "rgba(255,106,26,0.45)", width: 1 },
        label: { backgroundColor: "#FF6A1A", color: "#0A0B0F", fontWeight: 700 },
      },
      formatter: (params: { axisValue: number; data: number }[]) => {
        const p = params[0];
        const date = new Date(p.axisValue);
        return `
          <div style="font-weight:700;font-size:11px;color:#8A93A6;letter-spacing:0.06em;text-transform:uppercase;">${date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          <div style="margin-top:4px;font-family:JetBrains Mono,monospace;font-size:16px;font-weight:700;">$${p.data.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
        `;
      },
    },
    xAxis: {
      type: "time",
      data: xs,
      axisLabel: {
        color: "#8A93A6",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        formatter: (val: number) => {
          const d = new Date(val);
          return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).replace(/:\d\d$/, "");
        },
        hideOverlap: true,
      },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
      axisTick: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      scale: true,
      axisLabel: {
        color: "#8A93A6",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
        formatter: (val: number) => {
          if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
          return `$${val.toFixed(val < 1 ? 4 : 2)}`;
        },
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
    },
    series: [
      {
        type: "line",
        name: symbol,
        data: points.map(([t, p]) => [t, p]),
        smooth: true,
        symbol: "none",
        lineStyle: { color: lineColor, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: areaColor },
              { offset: 1, color: "rgba(0,0,0,0)" },
            ],
          },
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}