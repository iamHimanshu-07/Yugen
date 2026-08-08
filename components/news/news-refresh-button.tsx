/**
 * components/news/news-refresh-button.tsx — Manual news cache refresh.
 *
 * Client component used at the page-header level (outside NewsFeed) so users
 * can refresh the news from the page chrome itself. POSTs to /api/news/refresh
 * which clears the in-memory news cache + Next.js data cache, then reloads
 * the current page so server components refetch with fresh data.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewsRefreshButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      if (!res.ok) throw new Error("refresh failed");
      // Re-render server components so the freshly-cleared cache produces new data.
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="btn btn-secondary btn-sm"
      title="Clear cache and fetch latest news"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        opacity: busy ? 0.7 : 1,
        cursor: busy ? "wait" : "pointer",
      }}
    >
      <span
        aria-hidden
        style={{
          display: "inline-block",
          width: 12,
          height: 12,
          borderRadius: "50%",
          border: "1.5px solid currentColor",
          borderTopColor: "transparent",
          animation: busy ? "yugen-spin 0.7s linear infinite" : "none",
        }}
      />
      {err ? "Retry" : busy ? "Refreshing…" : "Refresh"}
      <style>{`@keyframes yugen-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}