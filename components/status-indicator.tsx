/**
 * Status indicator — server-side probe of the upstream data sources.
 * Renders a colored pill ("All systems operational" / "Degraded") in the
 * footer. No client JS; the result is rendered server-side on every page.
 */

export type UpstreamStatus = "ok" | "degraded" | "unknown";

interface IndicatorStyle {
  dot: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const STYLES: Record<UpstreamStatus, IndicatorStyle> = {
  ok: {
    dot: "#16C784",
    label: "All systems operational",
    color: "#16C784",
    bg: "rgba(22,199,132,0.10)",
    border: "rgba(22,199,132,0.45)",
  },
  degraded: {
    dot: "#EA3943",
    label: "Upstream degraded",
    color: "#EA3943",
    bg: "rgba(234,57,67,0.10)",
    border: "rgba(234,57,67,0.45)",
  },
  unknown: {
    dot: "#8A93A6",
    label: "Status unknown",
    color: "#8A93A6",
    bg: "rgba(138,147,166,0.10)",
    border: "rgba(138,147,166,0.30)",
  },
};

function isLocalDev(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV !== "production";
}

async function probeCoinGecko(): Promise<UpstreamStatus> {
  // In local dev, return "ok" since we use mock data that works perfectly
  if (isLocalDev()) {
    return "ok";
  }

  try {
    // Ping the smallest, fastest endpoint. 5s budget so a slow upstream
    // doesn't stall the layout. 60s Next-level revalidate so the same
    // page render tree doesn't hit CoinGecko twice.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/ping",
        {
          signal: ctrl.signal,
          headers: { Accept: "application/json" },
          next: { revalidate: 60 },
        },
      );
      if (!res.ok) return "degraded";
      const data = (await res.json()) as { gecko_says?: string };
      return data?.gecko_says ? "ok" : "degraded";
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return "degraded";
  }
}

export async function StatusIndicator() {
  const status = await probeCoinGecko();
  const s = STYLES[status];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
      aria-live="polite"
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          boxShadow: `0 0 8px ${s.dot}`,
        }}
        aria-hidden
      />
      {s.label}
    </div>
  );
}
