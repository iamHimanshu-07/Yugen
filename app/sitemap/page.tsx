/**
 * Human-readable sitemap page
 * Displays the sitemap data in a user-friendly format
 */
import { Metadata } from "next";
import { listCoins } from "@/lib/coins";

const SITE = "https://yugen-x.vercel.app";

export const metadata: Metadata = {
  title: "Sitemap — Yugen",
  description: "Human-readable sitemap of all pages on Yugen",
};

export default function SitemapPage() {
  const now = new Date();
  const coins = listCoins().map((c) => ({
    url: `${SITE}/coin/${c.coingeckoId}`,
    lastModified: now,
    changeFrequency: "hourly" as const,
    priority: 0.8,
    name: c.name,
    symbol: c.symbol,
  }));

  const pages = [
    {
      url: `${SITE}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      name: "Home",
      description: "Live cryptocurrency dashboard",
    },
    {
      url: `${SITE}/markets`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
      name: "Markets",
      description: "Overview of all 21 tracked cryptocurrencies",
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
      name: "About",
      description: "The story behind Yugen",
    },
    ...coins.map((coin) => ({
      ...coin,
      name: `${coin.name} (${coin.symbol})`,
      description: `Individual dashboard for ${coin.name}`,
    })),
  ];

  return (
    <>
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="section">
          <div className="hero-eyebrow" style={{ marginBottom: 16 }}>
            <span className="dot" />
            <span>sitemap · site map</span>
          </div>
          <h1 className="h-display" style={{ maxWidth: 720 }}>
            Sitemap — Yugen
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              All site pages at a glance
            </span>
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 16, maxWidth: 560 }}>
            This is a human-readable sitemap of Yugen. For the XML version used by
            search engines, visit <a href="/sitemap.xml" className="underline">
              /sitemap.xml
            </a>.
          </p>
        </div>
      </section>

      <section className="section-tight">
        <div className="eyebrow" style={{ marginBottom: 12 }}>
          <span className="dot" />
          <span>pages · {pages.length} total</span>
        </div>
        <h2 className="h-section">Site Pages</h2>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {pages.map((page) => (
            <div
              key={page.url}
              className="card"
              style={{ border: "1px solid rgba(138,147,166,0.2)" }}
            >
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 600 }}>
                  <a href={page.url.replace(SITE, "")} className="underline">
                    {page.name}
                  </a>
                </h3>
                {page.description && (
                  <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 12px 0" }}>
                    {page.description}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                  <span>Priority: {page.priority}</span>
                  <span>Updated: {new Date(page.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-tight" style={{ paddingTop: 24 }}>
        <div style={{ color: "var(--dim)", fontSize: 12, textAlign: "center" }}>
          Note: Search engines use the XML version at <a href="/sitemap.xml">/sitemap.xml</a> for indexing.
        </div>
      </section>
    </>
  );
}