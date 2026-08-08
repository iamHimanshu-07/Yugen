/**
 * app/onchain/page.tsx — On-Chain TVL Dashboard.
 *
 * Server Component. Fetches chain TVL and top protocols from DefiLlama.
 * Renders multi-chain TVL comparison chart + sortable protocol table.
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
  let loadError: string | null = null;

  try {
    // Parallel fetch: top chains + top protocols
    [chains, protocols] = await Promise.all([
      fetchTopChains(12),
      fetchProtocols(50),
    ]);

    // Fetch historical TVL for top 6 chains (for chart)
    const topChains = chains.slice(0, 6);
    const histResults = await Promise.all(
      topChains.map(async (c) => {
        try {
          const data = await fetchHistoricalChainTvl(c.name);
          const points: [number, number][] = data.map((d) => [d.date * 1000, d.totalLiquidityUSD] as [number, number]);
          return { chain: c.name, points };
        } catch {
          return { chain: c.name, points: [] as [number, number][] };
        }
      }),
    );
    historicalData = Object.fromEntries(histResults.map((r) => [r.chain, r.points]));
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load on-chain data";
  }

  const totalTvl = chains.reduce((sum, c) => sum + c.tvl, 0);
  const topChains = chains.slice(0, 6);

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
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--text)" }}>{fmtBigUSD(totalTvl)}</div>
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
        {loadError ? (
          <div className="card" style={{ borderColor: "var(--bear)" }}>
            <div style={{ color: "var(--bear)", fontWeight: 700, marginBottom: 8 }}>Could not reach DefiLlama</div>
            <div style={{ color: "var(--muted)", fontSize: 14 }}>{loadError}</div>
          </div>
        ) : (
          <>
            {/* TVL Comparison Chart */}
            <section style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>TVL Trends (30d)</h2>
                <div style={{ color: "var(--dim)", fontSize: 12 }}>
                  Top 6 chains by TVL. Hover for values. Updated {relativeTime(new Date().toISOString())}.
                </div>
              </div>
              <TVLChart
                chains={topChains.map((c) => c.name)}
                data={historicalData}
                colors={topChains.map((c) => c.tokenSymbol ? `#${c.tokenSymbol}` : undefined)}
              />
            </section>

            {/* Chain TVL Cards */}
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>Chain TVL Ranking</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {chains.map((chain, idx) => (
                  <ChainTvlCard key={chain.name} chain={chain} rank={idx + 1} />
                ))}
              </div>
            </section>

            {/* Protocol Table */}
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>Top Protocols by TVL</h2>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <select
                    id="category-filter"
                    className="select"
                    style={{ padding: "6px 10px", fontSize: 13, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                    defaultValue="all"
                  >
                    <option value="all">All Categories</option>
                    <option value="dex">DEX</option>
                    <option value="lending">Lending</option>
                    <option value="liquid staking">Liquid Staking</option>
                    <option value="bridge">Bridge</option>
                    <option value="cdp">CDP</option>
                    <option value="yield">Yield</option>
                  </select>
                  <select
                    id="chain-filter"
                    className="select"
                    style={{ padding: "6px 10px", fontSize: 13, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)" }}
                    defaultValue="all"
                  >
                    <option value="all">All Chains</option>
                    {Array.from(new Set(protocols.flatMap((p) => p.chains))).sort().map((chain) => (
                      <option key={chain} value={chain}>{chain}</option>
                    ))}
                  </select>
                </div>
              </div>
              <ProtocolTable protocols={protocols} />
            </section>
          </>
        )}
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

function ChainTvlCard({ chain, rank }: { chain: ChainTvl; rank: number }) {
  const change1d = chain.change_1d ?? 0;
  const change7d = chain.change_7d ?? 0;

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
        <span className={`mono ${pctColor(change1d)}`} style={{ fontWeight: 700 }}>
          {fmtPct(change1d)} 24h
        </span>
        <span className={`mono ${pctColor(change7d)}`} style={{ fontWeight: 700 }}>
          {fmtPct(change7d)} 7d
        </span>
      </div>
    </div>
  );
}