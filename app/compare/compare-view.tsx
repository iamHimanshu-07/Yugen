"use client";

/**
 * compare-view.tsx — client-side coin picker + normalized chart.
 *
 * Selection is URL-synced via ?coins=btc,eth,sol so a comparison can be
 * shared. The chart reuses the /api/chart/[id]?days=N endpoint, which
 * already has server-side 60s caching, so swapping picks is essentially
 * free after the first hit.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface PickOption {
  coingeckoId: string;
  symbol: string;
  name: string;
  color: string;
}

const RANGES = [
  { label: "7D",  days: 7 },
  { label: "30D", days: 30 },
  { label: "90D", days: 90 },
  { label: "1Y",  days: 365 },
];

const MAX_PICKS = 3;

export function CompareView({ picklist }: { picklist: PickOption[] }) {
  const router = useRouter();
  const search = useSearchParams();
  const initialIds = useMemo(() => {
    const raw = search.get("coins");
    if (raw) {
      const ids = raw.split(",").filter(Boolean);
      if (ids.length) return ids.slice(0, MAX_PICKS);
    }
    return ["bitcoin", "ethereum", "solana"];
  }, [search]);

  const [selected, setSelected] = useState<string[]>(initialIds);
  const [days, setDays] = useState<number>(30);
  const [series, setSeries] = useState<Array<{ coingeckoId: string; symbol: string; name: string; color: string; points: [number, number][] }>>([]);
  const [loading, setLoading] = useState(false);

  // Sync the URL when selection changes — replace, don't push, so back button
  // doesn't fill with intermediate picks.
  useEffect(() => {
    const params = new URLSearchParams(search.toString());
    params.set("coins", selected.join(","));
    router.replace(`/compare?${params.toString()}`, { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Fetch charts for the selected set whenever it changes.
  useEffect(() => {
    let aborted = false;
    setLoading(true);
    (async () => {
      const results = await Promise.all(
        selected.map(async (id) => {
          const meta = picklist.find((p) => p.coingeckoId === id);
          if (!meta) return null;
          const res = await fetch(`/api/chart/${id}?days=${days}`);
          if (!res.ok) return null;
          const data = (await res.json()) as { prices: [number, number][] };
          return { ...meta, points: data.prices };
        }),
      );
      if (aborted) return;
      setSeries(results.filter(Boolean) as typeof series);
      setLoading(false);
    })();
    return () => {
      aborted = true;
    };
  }, [selected, days, picklist]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PICKS) return prev; // cap at MAX_PICKS
      return [...prev, id];
    });
  }, []);

  const option = useMemo(() => buildOption(series, loading), [series, loading]);
  const picksRemaining = MAX_PICKS - selected.length;

  return (
    <div className="card" style={{ padding: 22 }}>
      {/* Range tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase" }}>Range</div>
          <div className="range-tabs">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                className={`range-tab ${days === r.days ? "active" : ""}`}
                onClick={() => setDays(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          {selected.length}/{MAX_PICKS} selected · {picksRemaining > 0 ? `pick ${picksRemaining} more` : "limit reached"}
        </div>
      </div>

      {/* Coin picker chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {picklist.map((p) => {
          const isSel = selected.includes(p.coingeckoId);
          const disabled = !isSel && selected.length >= MAX_PICKS;
          return (
            <button
              key={p.coingeckoId}
              type="button"
              onClick={() => toggle(p.coingeckoId)}
              disabled={disabled}
              aria-pressed={isSel}
              className="range-tab"
              style={{
                opacity: disabled ? 0.4 : isSel ? 1 : 0.55,
                color: isSel ? p.color : "var(--muted)",
                borderColor: isSel ? p.color : "rgba(255,255,255,0.08)",
              }}
            >
              {p.symbol}
            </button>
          );
        })}
      </div>

      <div style={{ height: 420, position: "relative" }}>
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13, zIndex: 2 }}>
            Loading…
          </div>
        )}
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} opts={{ renderer: "canvas" }} notMerge />
      </div>

      {/* Per-coin performance summary */}
      {series.length > 0 && (
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: `repeat(${series.length}, 1fr)`, gap: 12 }}>
          {series.map((s) => {
            const first = s.points[0]?.[1] ?? 0;
            const last = s.points[s.points.length - 1]?.[1] ?? 0;
            const pct = first > 0 ? ((last - first) / first) * 100 : 0;
            return (
              <div key={s.coingeckoId} className="metric-card">
                <div className="lbl" style={{ color: s.color }}>{s.symbol}</div>
                <div className="val" style={{ marginTop: 6 }}>{pct >= 0 ? "+" : ""}{pct.toFixed(2)}%</div>
                <div className={`delta ${pct >= 0 ? "delta-up" : "delta-down"}`} style={{ fontSize: 11 }}>
                  over {days === 365 ? "1Y" : `${days}D`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildOption(
  series: Array<{ symbol: string; name: string; color: string; points: [number, number][] }>,
  loading: boolean,
) {
  const empty = series.length === 0;
  const xs: number[] = empty ? [] : series[0].points.map(([t]) => t);

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 56, right: 20, top: 16, bottom: 36 },
    legend: {
      show: !empty,
      top: 0,
      left: "center",
      textStyle: { color: "#F5F7FA", fontFamily: "Inter, sans-serif", fontSize: 12 },
      itemGap: 18,
      icon: "roundRect",
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(17,20,27,0.96)",
      borderColor: "rgba(255,255,255,0.10)",
      borderWidth: 1,
      textStyle: { color: "#F5F7FA", fontFamily: "Inter, sans-serif", fontSize: 12 },
      padding: [8, 12],
      axisPointer: { type: "cross", lineStyle: { color: "rgba(255,106,26,0.45)", width: 1 } },
      formatter: (params: { axisValue: number; data: number; seriesName: string; marker: string }[]) => {
        const date = new Date(params[0].axisValue);
        const head = `<div style="font-weight:700;font-size:11px;color:#8A93A6;letter-spacing:0.06em;text-transform:uppercase;">${date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>`;
        const rows = params.map((p) => {
          const v = typeof p.data === "number" ? p.data.toFixed(2) : "—";
          return `<div style="margin-top:4px;font-family:JetBrains Mono,monospace;font-size:13px;display:flex;gap:8px;align-items:center;"><span>${p.marker}</span><span style="color:#8A93A6;min-width:64px;">${p.seriesName}</span><span style="font-weight:700;margin-left:auto;">${v}</span></div>`;
        }).join("");
        return head + rows;
      },
    },
    xAxis: {
      type: "time",
      data: xs,
      axisLabel: {
        color: "#8A93A6",
        fontSize: 11,
        fontFamily: "JetBrains Mono, monospace",
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
        formatter: (val: number) => val.toFixed(0),
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.04)" } },
    },
    series: empty
      ? []
      : series.map((s) => {
          const first = s.points[0]?.[1] ?? 0;
          return {
            type: "line",
            name: s.symbol,
            data: s.points.map(([t, p]) => [t, first > 0 ? (p / first) * 100 : p]),
            smooth: true,
            symbol: "none",
            lineStyle: { color: s.color, width: 2 },
            emphasis: { focus: "series" },
          };
        }),
    // Empty-state placeholder so ECharts still renders the axes.
    ...(empty && !loading
      ? {
          graphic: {
            type: "text",
            left: "center",
            top: "middle",
            style: { text: "Pick at least one coin to start.", fill: "#8A93A6", font: "12px Inter, sans-serif" },
          },
        }
      : {}),
  };
}
