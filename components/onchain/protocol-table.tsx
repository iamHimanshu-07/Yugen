/**
 * components/onchain/protocol-table.tsx — Sortable, filterable protocol table.
 *
 * Client component. Displays top DefiLlama protocols with TVL, changes, category.
 * Supports column sorting, category/chain filtering, and search.
 */

"use client";

import { useMemo, useState } from "react";
import { fmtBigUSD, fmtPct, pctColor } from "@/lib/utils";

export interface ProtocolRow {
  id: string;
  name: string;
  symbol: string | null;
  chain: string;
  category: string;
  tvl: number;
  change_1d: number | null;
  change_7d: number | null;
  url: string;
  logo: string | null;
}

interface ProtocolTableProps {
  protocols: ProtocolRow[];
}

type SortKey = "name" | "tvl" | "change_1d" | "change_7d" | "category" | "chain";
type SortDir = "asc" | "desc";

export function ProtocolTable({ protocols }: ProtocolTableProps) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("tvl");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  // Get unique categories and chains for filters
  const categories = useMemo(() => {
    const set = new Set(protocols.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [protocols]);

  const chains = useMemo(() => {
    const set = new Set(protocols.map((p) => p.chain).filter(Boolean));
    return Array.from(set).sort();
  }, [protocols]);

  // Filter protocols
  const filtered = useMemo(() => {
    return protocols.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.symbol?.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
      const matchesChain = chainFilter === "all" || p.chain === chainFilter;
      return matchesSearch && matchesCategory && matchesChain;
    });
  }, [protocols, search, categoryFilter, chainFilter]);

  // Sort protocols
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortKey];
      let bVal: any = b[sortKey];
      if (sortKey === "tvl") {
        aVal = a.tvl;
        bVal = b.tvl;
      } else if (sortKey === "change_1d") {
        aVal = a.change_1d ?? -Infinity;
        bVal = b.change_1d ?? -Infinity;
      } else if (sortKey === "change_7d") {
        aVal = a.change_7d ?? -Infinity;
        bVal = b.change_7d ?? -Infinity;
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ key }: { key: SortKey }) => {
    if (sortKey !== key) return "⇅";
    return sortDir === "asc" ? "▲" : "▼";
  };

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      {/* Filters */}
      <div style={{ padding: "16 20", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="search"
          placeholder="Search protocols…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            width: 280,
            outline: "none",
          }}
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            outline: "none",
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={chainFilter}
          onChange={(e) => { setChainFilter(e.target.value); setPage(0); }}
          style={{
            padding: "8px 12px",
            fontSize: 13,
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            color: "var(--text)",
            outline: "none",
          }}
        >
          <option value="all">All Chains</option>
          {chains.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ color: "var(--muted)", fontSize: 13, marginLeft: "auto" }}>
          {filtered.length} protocols
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
              <th className="sortable" onClick={() => handleSort("name")} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                Name <SortIcon key="name" />
              </th>
              <th className="sortable" onClick={() => handleSort("category")} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                Category <SortIcon key="category" />
              </th>
              <th className="sortable" onClick={() => handleSort("chain")} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                Chain <SortIcon key="chain" />
              </th>
              <th className="sortable" onClick={() => handleSort("tvl")} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                TVL <SortIcon key="tvl" />
              </th>
              <th className="sortable" onClick={() => handleSort("change_1d")} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                24h <SortIcon key="change_1d" />
              </th>
              <th className="sortable" onClick={() => handleSort("change_7d")} style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700, color: "var(--muted)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                7d <SortIcon key="change_7d" />
              </th>
              <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap" }}>
                Link
              </th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                  No protocols match your filters.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {p.logo && (
                        <img src={p.logo} alt="" style={{ width: 24, height: 24, borderRadius: 6, objectFit: "cover" }} />
                      )}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                        {p.symbol && <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>{p.symbol}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="pill pill-muted" style={{ fontSize: 11 }}>{p.category}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className="pill" style={{ fontSize: 11, background: "rgba(255,106,26,0.14)", color: "var(--accent)", borderColor: "rgba(255,106,26,0.45)" }}>
                      {p.chain}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{fmtBigUSD(p.tvl)}</div>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {p.change_1d != null && (
                      <div className={`mono ${pctColor(p.change_1d)}`} style={{ fontWeight: 700, fontSize: 13 }}>
                        {fmtPct(p.change_1d)}
                      </div>
                    )}
                    {p.change_1d == null && <span style={{ color: "var(--dim)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    {p.change_7d != null && (
                      <div className={`mono ${pctColor(p.change_7d)}`} style={{ fontWeight: 700, fontSize: 13 }}>
                        {fmtPct(p.change_7d)}
                      </div>
                    )}
                    {p.change_7d == null && <span style={{ color: "var(--dim)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <a href={p.url} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                      ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ padding: "16px 20px", display: "flex", justifyContent: "center", gap: 8, borderTop: "1px solid var(--border)" }}>
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{ padding: "6px 12px", fontSize: 13, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.5 : 1 }}
          >
            Prev
          </button>
          <span style={{ display: "flex", alignItems: "center", color: "var(--muted)", fontSize: 13 }}>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{ padding: "6px 12px", fontSize: 13, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", opacity: page === totalPages - 1 ? 0.5 : 1 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}