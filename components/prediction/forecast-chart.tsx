/**
 * components/prediction/forecast-chart.tsx — BTC price prediction chart.
 *
 * Client component. Shows historical price + predicted next day with confidence band.
 * Uses data from /api/predict/btc endpoint.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fmtUSD, fmtPct } from "@/lib/utils";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export interface PredictionData {
  prediction: {
    price: number;
    lower: number;
    upper: number;
    direction: "up" | "down" | "flat";
    confidence: number;
    model: string;
    features: {
      momentum: number;
      volatility: number;
      volumeTrend: number;
      fearGreed: number;
      btcDominance: number;
      timestamp: number;
    };
    backtest?: {
      mae: number;
      rmse: number;
      directionAccuracy: number;
    };
  };
  display: {
    price: string;
    range: string;
    direction: string;
    confidenceLabel: string;
    confidencePct: number;
  };
  historicalPoints: [number, number][]; // [timestamp_ms, price]
}

interface ForecastChartProps {
  data: PredictionData;
}

export function ForecastChart({ data }: ForecastChartProps) {
  const { prediction, historicalPoints } = data;
  const lastPoint = historicalPoints[historicalPoints.length - 1];
  const nextDayMs = lastPoint[0] + 86_400_000;

  // Build prediction points for the band
  const predictionPoints = [
    [lastPoint[0], lastPoint[1]],
    [nextDayMs, prediction.price],
  ];
  const upperPoints = [
    [lastPoint[0], lastPoint[1]],
    [nextDayMs, prediction.upper],
  ];
  const lowerPoints = [
    [lastPoint[0], lastPoint[1]],
    [nextDayMs, prediction.lower],
  ];

  const option = useMemo(() => {
    const prices = historicalPoints.map(([, p]) => p);
    const minPrice = Math.min(...prices, prediction.lower);
    const maxPrice = Math.max(...prices, prediction.upper);
    const padding = (maxPrice - minPrice) * 0.1;

    const isUp = prediction.direction === "up";
    const lineColor = isUp ? "#16C784" : prediction.direction === "down" ? "#EA3943" : "#FF6A1A";
    const bandColor = isUp ? "rgba(22,199,132,0.15)" : prediction.direction === "down" ? "rgba(234,57,67,0.15)" : "rgba(255,106,26,0.15)";

    return {
      backgroundColor: "transparent",
      animation: false,
      grid: { left: 60, right: 20, top: 16, bottom: 36 },
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
        formatter: (params: any[]) => {
          const p = params[0];
          const date = new Date(p.axisValue);
          const isPrediction = p.axisValue >= nextDayMs;
          return `
            <div style="font-weight:700;font-size:11px;color:#8A93A6;letter-spacing:0.06em;text-transform:uppercase;">${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}${isPrediction ? " (Predicted)" : ""}</div>
            <div style="margin-top:4px;font-family:JetBrains Mono,monospace;font-size:16px;font-weight:700;">${fmtUSD(p.data)}</div>
            ${isPrediction ? `<div style="margin-top:2px;font-size:11px;color:#8A93A6;">95% CI: ${data.display.range}</div>` : ""}
          `;
        },
      },
      xAxis: {
        type: "time",
        axisLabel: {
          color: "#8A93A6",
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          formatter: (val: number) => {
            const d = new Date(val);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
        min: minPrice - padding,
        max: maxPrice + padding,
        axisLabel: {
          color: "#8A93A6",
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          formatter: (val: number) => fmtUSD(val, val < 1000 ? 2 : 0),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      series: [
        // Confidence band (area between upper and lower)
        {
          name: "95% Confidence",
          type: "custom",
          renderItem: (params: any, api: any) => {
            const start = api.coord([api.value(0)[0], api.value(0)[1]]);
            const end = api.coord([api.value(1)[0], api.value(1)[1]]);
            return {
              type: "polygon",
              shape: {
                points: [
                  [start[0], start[1]],
                  [end[0], end[1]],
                  [end[0], end[1]], // simplified for line
                ],
              },
              style: api.style({ fill: bandColor, stroke: lineColor, lineWidth: 1, lineDash: [4, 4] }),
            };
          },
          data: [lowerPoints, upperPoints], // simplified
          z: 1,
        },
        // Historical price
        {
          name: "BTC Price",
          type: "line",
          data: historicalPoints.map(([t, p]) => [t, p]),
          smooth: true,
          symbol: "none",
          lineStyle: { color: "#8A93A6", width: 2 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(138,147,166,0.12)" },
                { offset: 1, color: "rgba(0,0,0,0)" },
              ],
            },
          },
          z: 2,
        },
        // Prediction line (dashed)
        {
          name: "Prediction",
          type: "line",
          data: predictionPoints,
          smooth: false,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: lineColor, width: 2, type: "dashed" },
          itemStyle: { color: lineColor },
          z: 3,
        },
        // Prediction point (larger)
        {
          name: "Predicted",
          type: "scatter",
          data: [[nextDayMs, prediction.price]],
          symbol: "circle",
          symbolSize: 12,
          itemStyle: { color: lineColor, borderColor: "#0A0B0F", borderWidth: 3 },
          z: 4,
        },
      ],
    };
  }, [historicalPoints, prediction, lastPoint, nextDayMs, data.display.range]);

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>BTC · Next-Day Forecast</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em" }}>
            {data.display.price}
          </div>
          <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className={`delta ${data.prediction.direction === "up" ? "delta-up" : data.prediction.direction === "down" ? "delta-down" : ""}`} style={{ fontWeight: 700, fontSize: 14 }}>
              {data.display.direction}
            </span>
            <span className={`delta ${data.prediction.direction === "up" ? "delta-up" : data.prediction.direction === "down" ? "delta-down" : ""}`} style={{ fontWeight: 700, fontSize: 13 }}>
              95% CI: {data.display.range}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>Confidence</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
            {data.display.confidencePct}%
          </div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>{data.display.confidenceLabel}</div>
        </div>
      </div>

      <div style={{ height: 380, position: "relative" }}>
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge />
      </div>

      {/* Model info */}
      <div style={{ marginTop: 16, padding: 16, background: "var(--bg-elevated)", borderRadius: 12, border: "1px solid var(--border)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, fontSize: 12 }}>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Model</div>
            <div className="mono" style={{ fontWeight: 600 }}>{data.prediction.model}</div>
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Momentum (7d)</div>
            <div className="mono" style={{ fontWeight: 600 }}>{fmtPct(data.prediction.features.momentum * 100)}</div>
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Volatility (7d)</div>
            <div className="mono" style={{ fontWeight: 600 }}>{(data.prediction.features.volatility * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Volume Trend</div>
            <div className="mono" style={{ fontWeight: 600 }}>{fmtPct(data.prediction.features.volumeTrend * 100)}</div>
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>Fear & Greed</div>
            <div className="mono" style={{ fontWeight: 600 }}>{data.prediction.features.fearGreed}/100</div>
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontWeight: 700, marginBottom: 4 }}>BTC Dominance</div>
            <div className="mono" style={{ fontWeight: 600 }}>{data.prediction.features.btcDominance.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}