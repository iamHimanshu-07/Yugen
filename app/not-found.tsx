/**
 * 404 — dark themed, brand-styled. Rendered by Next.js whenever a route
 * doesn't resolve (including unknown /coin/[id] values, broken links, etc.).
 */
import Link from "next/link";

export const metadata = {
  title: "Not found · Yugen",
};

export default function NotFound() {
  return (
    <section
      className="section"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        paddingTop: 120,
      }}
    >
      <div className="hero-eyebrow" style={{ marginBottom: 24 }}>
        <span className="dot" />
        <span>404 · the depth is elsewhere</span>
      </div>

      <h1
        className="h-display"
        style={{
          fontSize: "clamp(48px, 8vw, 96px)",
          maxWidth: 900,
          margin: 0,
        }}
      >
        This coin didn&apos;t make
        <br />
        <span
          style={{
            background: "linear-gradient(90deg, var(--accent) 0%, var(--accent-2) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          the catalog.
        </span>
      </h1>

      <p
        style={{
          marginTop: 24,
          maxWidth: 540,
          color: "var(--muted)",
          fontSize: 17,
          lineHeight: 1.6,
        }}
      >
        Either the URL is wrong, or this is one of the &gt;12,000 coins we deliberately
        didn&apos;t track. Yugen focuses on the 14 that actually matter — pick one below.
      </p>

      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/markets"
          className="btn btn-primary"
          style={{ height: 52, padding: "0 24px", fontSize: 15 }}
        >
          Browse the 14 coins →
        </Link>
        <Link
          href="/coin/bitcoin"
          className="btn btn-ghost"
          style={{ height: 52, padding: "0 24px", fontSize: 15 }}
        >
          Open Bitcoin <span className="symbol">₿</span>
        </Link>
        <Link
          href="/"
          className="btn btn-ghost"
          style={{ height: 52, padding: "0 24px", fontSize: 15 }}
        >
          ← Home
        </Link>
      </div>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          gap: 22,
          flexWrap: "wrap",
          justifyContent: "center",
          color: "var(--dim)",
          fontSize: 12,
          letterSpacing: "0.04em",
        }}
      >
        <Link href="/coin/ethereum" style={{ color: "inherit", textDecoration: "none" }}>Ethereum</Link>
        <span>·</span>
        <Link href="/coin/solana" style={{ color: "inherit", textDecoration: "none" }}>Solana</Link>
        <span>·</span>
        <Link href="/coin/chainlink" style={{ color: "inherit", textDecoration: "none" }}>Chainlink</Link>
        <span>·</span>
        <Link href="/coin/monero" style={{ color: "inherit", textDecoration: "none" }}>Monero</Link>
        <span>·</span>
        <Link href="/coin/tether" style={{ color: "inherit", textDecoration: "none" }}>Tether</Link>
      </div>
    </section>
  );
}