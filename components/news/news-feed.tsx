/**
 * components/news/news-feed.tsx — Crypto news feed with infinite scroll.
 *
 * Client component. Fetches from /api/news, supports currency filtering,
 * category tabs, and load-more pagination.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { relativeTime } from "@/lib/utils";
import Link from "next/link";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  currencies?: string[];
  kind?: string;
  domain?: string;
}

interface NewsFeedProps {
  initialItems?: NewsItem[];
  currencies?: string[];
  limit?: number;
}

export function NewsFeed({ initialItems = [], currencies = [], limit = 20 }: NewsFeedProps) {
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchNews = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(pageNum),
        ...(currencies.length > 0 && { currencies: currencies.join(",") }),
      });
      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const newItems = data.items ?? [];

      if (append) {
        setItems((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const unique = newItems.filter((i: NewsItem) => !existingIds.has(i.id));
          return [...prev, ...unique];
        });
      } else {
        setItems(newItems);
      }
      setHasMore(newItems.length >= limit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load news");
    } finally {
      setLoading(false);
    }
  }, [currencies, limit]);

  // Initial load
  useEffect(() => {
    if (initialItems.length === 0) {
      fetchNews(1, false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage, true);
    }
  };

  /**
   * Manual refresh — busts the server's in-memory news cache + Next.js data
   * cache for the news pages, then refetches the first page from the client.
   * One click, one POST, no spam protection needed (humans don't mash this).
   */
  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/news/refresh", { method: "POST" });
      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();
      setRefreshedAt(data.at ?? new Date().toISOString());
      // Re-pull page 1 with the now-cleared cache.
      setPage(1);
      await fetchNews(1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchNews]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header with source badges + refresh button */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, alignItems: "center" }}>
        <span className="src-pill">CRYPTOPANIC</span>
        <span className="src-pill" style={{ background: "rgba(34,197,94,0.14)", color: "#22C55E", borderColor: "rgba(34,197,94,0.45)" }}>
          RSS FALLBACK
        </span>
        {currencies.length > 0 && currencies.map((c) => (
          <span key={c} className="pill" style={{ background: "rgba(255,106,26,0.14)", color: "var(--accent)", borderColor: "rgba(255,106,26,0.45)", fontSize: 10, textTransform: "uppercase" }}>
            {c}
          </span>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {refreshedAt && (
            <span style={{ color: "var(--dim)", fontSize: 11 }} title={new Date(refreshedAt).toLocaleString()}>
              refreshed {relativeTime(refreshedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing || loading}
            aria-label="Refresh news"
            title="Clear cache and fetch latest news"
            className="btn btn-secondary btn-sm"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              padding: "4px 10px",
              opacity: refreshing ? 0.7 : 1,
              cursor: refreshing ? "wait" : "pointer",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "1.5px solid currentColor",
                borderTopColor: "transparent",
                animation: refreshing ? "spin 0.7s linear infinite" : "none",
              }}
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>

      {/* News Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ borderColor: "var(--bear)", padding: 16, color: "var(--bear)" }}>
          {error}
          <button onClick={() => fetchNews(page, false)} className="btn btn-primary btn-sm" style={{ marginLeft: 12 }}>
            Retry
          </button>
        </div>
      )}

      {/* Load More / Loading */}
      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loading}
          className="btn btn-secondary"
          style={{ width: "100%", height: 44, fontSize: 13 }}
        >
          {loading ? "Loading…" : "Load more"}
        </button>
      )}

      {!hasMore && items.length > 0 && (
        <div style={{ textAlign: "center", color: "var(--dim)", fontSize: 12, padding: 16 }}>
          No more articles.
        </div>
      )}
    </div>
  );
}

/* ============================== News Card ============================== */

function NewsCard({ item }: { item: NewsItem }) {
  const published = relativeTime(item.publishedAt);
  const isExternal = item.url && !item.url.startsWith("#");

  return (
    <Link href={item.url} target="_blank" rel="noopener" style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card" style={{ padding: 20, display: "flex", gap: 16, transition: "border-color 0.15s, background 0.15s", border: "1px solid transparent" }}>
        {/* Source indicator */}
        <div style={{ width: 8, borderRadius: 4, background: "linear-gradient(180deg, var(--accent), var(--accent-2))", flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: source + time */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: "var(--text)" }}>{item.source}</span>
            <span style={{ color: "var(--dim)", fontSize: 11 }}>{published}</span>
            {item.kind && (
              <span className="pill pill-muted" style={{ fontSize: 10, textTransform: "capitalize" }}>{item.kind}</span>
            )}
            {item.currencies && item.currencies.length > 0 && (
              <span style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                {item.currencies.slice(0, 3).map((c) => (
                  <span key={c} className="pill" style={{ fontSize: 10, background: "rgba(255,106,26,0.1)", color: "var(--accent)", borderColor: "rgba(255,106,26,0.3)" }}>
                    {c}
                  </span>
                ))}
                {item.currencies.length > 3 && (
                  <span className="pill pill-muted" style={{ fontSize: 10 }}>+{item.currencies.length - 3}</span>
                )}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.35, margin: 0, color: "var(--text)" }}>
            {item.title}
          </h3>
        </div>

        {/* External link icon */}
        {isExternal && (
          <span style={{ color: "var(--muted)", fontSize: 18, marginTop: 2, flexShrink: 0 }}>↗</span>
        )}
      </div>
    </Link>
  );
}