/**
 * components/onchain/tvl-chart.tsx — Multi-chain TVL comparison chart (ECharts).
 *
 * Client component. Receives pre-fetched historical TVL data for multiple chains.
 * Renders interactive area chart with chain selector legend.
 */

"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fmtBigUSD } from "@/lib/utils";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface TVLChartProps {
  chains: string[];
  data: Record<string, [number, number][]>; // chain -> [timestamp_ms, tvl][]
  colors?: (string | undefined)[];
}

// Chain color palette (DefiLlama doesn't provide colors, use consistent palette)
const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA",
  Solana: "#14F195",
  BSC: "#F0B90B", // DefiLlama uses "BSC", not "Binance Smart Chain"
  "Binance Smart Chain": "#F0B90B",
  Arbitrum: "#28A0F0",
  Polygon: "#8247E5",
  Avalanche: "#E84142",
  Optimism: "#FF0420",
  Base: "#0052FF",
  Tron: "#FF060A",
  Bitcoin: "#F7931A",
  Fantom: "#1969FF",
  Cronos: "#07A0C3",
  Kava: "#1A1A2E",
};

export function TVLChart({ chains, data, colors: propColors }: TVLChartProps) {
  const [visibleChains, setVisibleChains] = useState(chains);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    chains.forEach((chain, i) => {
      map[chain] = propColors?.[i] ?? CHAIN_COLORS[chain] ?? `hsl(${(i * 137) % 360}, 70%, 50%)`;
    });
    return map;
  }, [chains, propColors]);

  const option = useMemo(() => {
    const allPoints = Object.values(data).flat();
    const maxTvl = allPoints.length > 0 ? Math.max(...allPoints.map(([, v]) => v)) : 1;
    const minDate = allPoints.length > 0 ? Math.min(...allPoints.map(([t]) => t)) : Date.now();
    const maxDate = allPoints.length > 0 ? Math.max(...allPoints.map(([t]) => t)) : Date.now();

    const series = visibleChains.map((chain) => {
      const points = data[chain] ?? [];
      const color = colorMap[chain];
      return {
        name: chain,
        type: "line",
        data: points.map(([t, v]) => [t, v]),
        smooth: true,
        symbol: "none",
        lineStyle: { color, width: 2 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}40` },
              { offset: 1, color: `${color}00` },
            ],
          },
        },
        emphasis: { focus: "series" },
        showSymbol: false,
      };
    });

    return {
      backgroundColor: "transparent",
      animation: false,
      legend: {
        show: true,
        top: 0,
        left: "center",
        itemWidth: 16,
        itemHeight: 8,
        textStyle: { color: "#8A93A6", fontSize: 11, fontFamily: "Inter, sans-serif" },
        selector: true,
        selectorLabel: {
          color: "#8A93A6",
          fontSize: 11,
          borderColor: "rgba(255,255,255,0.1)",
          borderRadius: 4,
        },
        data: chains,
        selected: Object.fromEntries(chains.map((c) => [c, visibleChains.includes(c)])),
      },
      grid: { left: 60, right: 20, top: 40, bottom: 36 },
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
          const date = new Date(params[0].axisValue);
          const lines = [`<div style="font-weight:700;font-size:11px;color:#8A93A6;letter-spacing:0.06em;text-transform:uppercase;">${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>`];
          params.forEach((p) => {
            if (p.value[1] != null) {
              lines.push(`<div style="margin-top:4px;display:flex;align-items:center;gap:8px;">`);
              lines.push(`<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${p.color}"></span>`);
              lines.push(`<span style="font-family:JetBrains Mono,monospace;font-size:13px;font-weight:700;">${p.seriesName}</span>`);
              lines.push(`<span style="font-family:JetBrains Mono,monospace;font-size:14px;font-weight:700;margin-left:auto;">${fmtBigUSD(p.value[1])}</span>`);
              lines.push(`</div>`);
            }
          });
          return lines.join("");
        },
      },
      xAxis: {
        type: "time",
        min: minDate,
        max: maxDate,
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
        max: maxTvl * 1.15,
        axisLabel: {
          color: "#8A93A6",
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          formatter: (val: number) => {
            if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
            if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
            if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
            return `$${val.toFixed(0)}`;
          },
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
      },
      series,
    };
  }, [visibleChains, data, colorMap, chains]);

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ height: 420, position: "relative" }}>
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge />
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--muted)" }}>
        <span>Click legend to toggle chains</span>
        <span style={{ color: "var(--dim)" }}>•</span>
        <span>Hover for exact TVL values</span>
      </div>
    </div>
  );
}