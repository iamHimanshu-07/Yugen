/**
 * app/onchain/page.tsx — On-Chain TVL Dashboard.
 *
 * Server Component. Fetches chain TVL and top protocols from DefiLlama.
 * Renders multi-chain TVL comparison chart + sortable protocol table.
 *
 * Filters: ProtocolTable owns its own filter UI (search + category + chain).
 * Earlier versions had duplicate <select>s on the page that did nothing —
 * they've been removed; the component controls its own state.
 *
 * Failure modes:
 *   - chains fetch fails → protocol table still rendered with a notice
 *   - protocols fetch fails → only the chain cards + chart shown
 *   - historical chain TVL fails per-chain → that chain is skipped silently
 */

import { fetchTopChains, fetchProtocols, fetchHistoricalChainTvl } from "@/lib/defillama";
import { fmtBigUSD, fmtPct, pctColor, relativeTime } from "@/lib/utils";
import { TVLChart } from "@/components/onchain/tvl-chart";
import { ProtocolTable } from "@/components/onchain/protocol-table";

export const revalidate = 300;

export const metadata = {
  title: "On-Chain — Yugen",
  description: "Total Value Locked across chains and top DeFi protocols. Live from DefiLlama.",
};

type ChainTvl = Awaited<ReturnType<typeof fetchTopChains>>[0];
type Protocol = Awaited<ReturnType<typeof fetchProtocols>>[0];

export default async function OnChainPage() {
  let chains: ChainTvl[] = [];
  let protocols: Protocol[] = [];
  let historicalData: Record<string, [number, number][]> = {};
  let chainsError: string | null = null;
  let protocolsError: string | null = null;

  // Fetch chains and protocols in parallel; each has its own error path so
  // one upstream failure doesn't blank the entire page.
  const [chainsResult, protocolsResult] = await Promise.allSettled([
    fetchTopChains(12),
    fetchProtocols(50),
  ]);

  if (chainsResult.status === "fulfilled") {
    chains = chainsResult.value;
  } else {
    chainsError =
      chainsResult.reason instanceof Error
        ? chainsResult.reason.message
        : "Could not load chains";
  }

  if (protocolsResult.status === "fulfilled") {
    protocols = protocolsResult.value;
  } else {
    protocolsError =
      protocolsResult.reason instanceof Error
        ? protocolsResult.reason.message
        : "Could not load protocols";
  }

  // Fetch historical TVL for top 6 chains (for chart). Each chain's fetch is
  // independently try/caught, so one rate-limit doesn't break the whole chart.
  // Trim server-side to 31 days — DefiLlama returns 3000+ rows per chain
  // but the chart only needs the last 30.
  const HISTORY_DAYS = 31;
  const topChains = chains.slice(0, 6);
  const histResults = await Promise.all(
    topChains.map(async (c) => {
      try {
        const data = await fetchHistoricalChainTvl(c.name, HISTORY_DAYS);
        const points: [number, number][] = data.map(
          (d) => [d.date * 1000, d.tvl] as [number, number],
        );
        return { chain: c.name, points };
      } catch {
        return { chain: c.name, points: [] as [number, number][] };
      }
    }),
  );
  historicalData = Object.fromEntries(histResults.map((r) => [r.chain, r.points]));

  // Compute 24h / 7d TVL change per top-12 chain from history. DefiLlama's
  // /v2/chains endpoint doesn't expose change_1d/change_7d directly, so we
  // derive them here. For chains outside the top 12 we show "—" on the card.
  const chainsWithChange = await attachTvlChanges(chains);

  const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);
  const totalHistoryPoints = Object.values(historicalData).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  return (
    <>
      <header className="section-tight" style={{ paddingTop: 56, paddingBottom: 0 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>On-Chain</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 className="h-section" style={{ fontSize: "clamp(32px, 4vw, 44px)" }}>
              DeFi TVL <span style={{ color: "var(--muted)", fontWeight: 700 }}>across chains & protocols</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: 24, color: "var(--muted)", fontSize: 13 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Total TVL (top 12)</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>
                {chains.length > 0 ? fmtBigUSD(totalTvl) : "—"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Chains tracked</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{chains.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 700 }}>Source</div>
              <div className="mono" style={{ fontSize: 14, color: "var(--accent)" }}>DefiLlama</div>
            </div>
          </div>
        </div>
      </header>

      <div className="section-tight" style={{ paddingTop: 32 }}>
        {chainsError && (
          <div className="card" style={{ borderColor: "var(--bear)", marginBottom: 24 }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>
              Could not reach DefiLlama for chains
            </div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{chainsError}</div>
          </div>
        )}

        {/* TVL Comparison Chart */}
        {topChains.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>TVL Trends (30d)</h2>
              <div style={{ color: "var(--dim)", fontSize: 12 }}>
                Top {topChains.length} chains by TVL. Hover for values. Updated {relativeTime(new Date().toISOString())}.
              </div>
            </div>
            <TVLChart
              chains={topChains.map((c) => c.name)}
              data={historicalData}
            />
            {totalHistoryPoints === 0 && (
              <div style={{ color: "var(--dim)", fontSize: 12, marginTop: 10 }}>
                Live history unavailable right now (DefiLlama rate-limited). The chart will
                populate next refresh.
              </div>
            )}
          </section>
        )}

        {/* Chain TVL Cards */}
        {chains.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Chain TVL Ranking</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {chainsWithChange.map((chain, idx) => (
                <ChainTvlCard key={chain.name} chain={chain} rank={idx + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Protocol Table — ProtocolTable owns its own filter UI */}
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Top Protocols by TVL</h2>
          </div>

          {protocolsError ? (
            <div className="card" style={{ borderColor: "var(--bear)" }}>
              <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>
                Could not load protocols
              </div>
              <div style={{ color: "var(--muted)", fontSize: 14 }}>{protocolsError}</div>
            </div>
          ) : (
            <ProtocolTable protocols={protocols} />
          )}
        </section>
      </div>

      <section className="section-tight" style={{ paddingTop: 8 }}>
        <div style={{ color: "var(--dim)", fontSize: 12, lineHeight: 1.6 }}>
          TVL data from <a href="https://defillama.com" target="_blank" rel="noopener" style={{ color: "var(--accent)" }}>DefiLlama</a> (free API).
          Updates every ~5 minutes. TVL = Total Value Locked in DeFi protocols.
        </div>
      </section>
    </>
  );
}

/* ============================== Chain TVL Card ============================== */

// Chain TVL with computed 24h/7d changes. DefiLlama's /v2/chains doesn't
// expose these on the chain list; we derive them from historical TVL.
type ChainTvlWithChange = ChainTvl & {
  computedChange1d: number | null;
  computedChange7d: number | null;
};

/**
 * For each chain, fetch the last 8 days of history once and compute both
 * 24h / 7d percentage change from it. One fetch per chain instead of two.
 * Failures degrade to null (rendered as "—") — never throw, never block.
 */
async function attachTvlChanges(chains: ChainTvl[]): Promise<ChainTvlWithChange[]> {
  return Promise.all(
    chains.map(async (c) => {
      try {
        // 8 days covers both a 1d and a 7d comparison.
        const history = await fetchHistoricalChainTvl(c.name, 8);
        const computedChange1d = pctChangeAt(history, 1);
        const computedChange7d = pctChangeAt(history, 7);
        return { ...c, computedChange1d, computedChange7d };
      } catch {
        return { ...c, computedChange1d: null, computedChange7d: null };
      }
    }),
  );
}

function pctChangeAt(history: { date: number; tvl: number }[], days: number): number | null {
  if (history.length < 2) return null;
  const current = history[history.length - 1].tvl;
  const cutoff = Date.now() / 1000 - days * 86400;
  // Pick the snapshot closest to (now - days) without going past it.
  // Why not `find(h => h.date >= cutoff)`? Because for a 1d window the most
  // recent row may itself be within the last 24h (e.g. published 3h ago) —
  // it would become both "current" and "past", making the change 0.
  const past = [...history].reverse().find((h) => h.date <= cutoff) ?? history[0];
  if (!past.tvl || past.tvl <= 0) return null;
  return ((current - past.tvl) / past.tvl) * 100;
}

function ChainTvlCard({ chain, rank }: { chain: ChainTvlWithChange; rank: number }) {
  const change1d = chain.computedChange1d;
  const change7d = chain.computedChange7d;

  return (
    <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: "var(--muted)", width: 36, textAlign: "right" }}>
          #{rank}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {chain.name}
          </div>
          {chain.tokenSymbol && (
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{chain.tokenSymbol}</div>
          )}
        </div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap" }}>
          {fmtBigUSD(chain.tvl)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, marginTop: 4 }}>
        <span className={`mono ${change1d != null ? pctColor(change1d) : ""}`} style={{ fontWeight: 700, color: change1d == null ? "var(--dim)" : undefined }}>
          {change1d != null ? `${fmtPct(change1d)} 24h` : "— 24h"}
        </span>
        <span className={`mono ${change7d != null ? pctColor(change7d) : ""}`} style={{ fontWeight: 700, color: change7d == null ? "var(--dim)" : undefined }}>
          {change7d != null ? `${fmtPct(change7d)} 7d` : "— 7d"}
        </span>
      </div>
    </div>
  );
}