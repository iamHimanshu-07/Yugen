/**
 * Loading skeleton for /coin/[id] — Next.js wraps the route in this UI while
 * the server fetches detail + chart + social feed. Mirrors the actual page
 * geometry (3 columns, chart card, metric cards) so the swap is seamless.
 */

function SkeletonBox({ height = 16, width = "100%", radius = 8 }: { height?: number | string; width?: string | number; radius?: number }) {
  return <div className="skeleton" style={{ height, width, borderRadius: radius }} />;
}

function MetricCardSkeleton() {
  return (
    <div className="metric-card">
      <SkeletonBox width="55%" height={10} />
      <div style={{ marginTop: 12 }}><SkeletonBox width="65%" height={28} radius={10} /></div>
      <div style={{ marginTop: 10 }}><SkeletonBox width="40%" height={10} /></div>
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <SkeletonBox width={120} height={10} />
          <div style={{ marginTop: 10 }}><SkeletonBox width={200} height={32} radius={10} /></div>
          <div style={{ marginTop: 8 }}><SkeletonBox width={140} height={12} /></div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ width: 56, height: 32, borderRadius: 10 }} />
          ))}
        </div>
      </div>
      <SkeletonBox width="100%" height={380} radius={14} />
    </div>
  );
}

function SentimentSkeleton() {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <SkeletonBox width={140} height={12} />
        <SkeletonBox width={60} height={12} />
      </div>
      <div style={{ marginTop: 18 }}>
        <SkeletonBox width="100%" height={10} radius={999} />
      </div>
      <div style={{ marginTop: 14, display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}><SkeletonBox width="80%" height={12} /></div>
        <div style={{ flex: 1 }}><SkeletonBox width="80%" height={12} /></div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <SkeletonBox width={140} height={14} />
        <SkeletonBox width={60} height={12} />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="post" style={{ paddingTop: 14, paddingBottom: 14, borderTop: i === 1 ? "none" : "1px solid var(--border)" }}>
          <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 999 }} />
          <div className="body" style={{ flex: 1 }}>
            <SkeletonBox width="35%" height={10} />
            <div style={{ marginTop: 8 }}><SkeletonBox width="95%" height={12} /></div>
            <div style={{ marginTop: 6 }}><SkeletonBox width="60%" height={12} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RightColumnSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="card">
        <SkeletonBox width={120} height={12} />
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ width: 70, height: 24, borderRadius: 999 }} />
          ))}
        </div>
      </div>
      <div className="card">
        <SkeletonBox width={100} height={12} />
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div className="skeleton" style={{ width: 28, height: 28, borderRadius: 8 }} />
              <div style={{ flex: 1 }}>
                <SkeletonBox width="65%" height={11} />
                <div style={{ marginTop: 6 }}><SkeletonBox width="40%" height={9} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CoinLoading() {
  return (
    <>
      {/* Header skeleton */}
      <header className="coin-header">
        <div className="id-block">
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: 18 }} />
          <div>
            <SkeletonBox width={220} height={28} radius={10} />
            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <div className="skeleton" style={{ width: 84, height: 20, borderRadius: 999 }} />
              <div className="skeleton" style={{ width: 64, height: 20, borderRadius: 999 }} />
            </div>
          </div>
        </div>
        <div className="price-line">
          <SkeletonBox width={200} height={44} radius={12} />
          <div style={{ marginTop: 10 }}><SkeletonBox width={120} height={14} /></div>
        </div>
      </header>

      {/* Tabs skeleton */}
      <div className="tab-strip" style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton" style={{ width: 64, height: 32, borderRadius: 8, marginRight: 8 }} />
        ))}
      </div>

      <div className="detail-grid">
        {/* Left column */}
        <div className="col-left" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
          <MetricCardSkeleton />
        </div>

        {/* Center column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ChartCardSkeleton />
          <SentimentSkeleton />
          <FeedSkeleton />
        </div>

        {/* Right column */}
        <div className="col-right">
          <RightColumnSkeleton />
        </div>
      </div>
    </>
  );
}