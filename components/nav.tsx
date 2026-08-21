/**
 * nav.tsx — sticky top nav reused across every page.
 * Pure server component; brand wordmark + section links + CTA.
 */
import Link from "next/link";
import { CATALOG_SIZE } from "@/lib/coins";

export function TopNav() {
  return (
    <header className="topnav">
      <div className="topnav-inner">
        <Link href="/" className="topnav-link" style={{ fontWeight: 700, color: "var(--text)" }}>
          <span className="symbol" style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)",
            color: "#0A0B0F", fontWeight: 800, fontSize: 14,
          }}>◬</span>
          <span style={{ letterSpacing: "-0.02em" }}>Yugen</span>
        </Link>
        <nav className="topnav-links">
          <Link href="/markets" className="topnav-link">Markets <span className="pill pill-muted" style={{ marginLeft: 4 }}>{CATALOG_SIZE}</span></Link>
          <Link href="/compare" className="topnav-link">Compare</Link>
          <Link href="/onchain" className="topnav-link">On-Chain</Link>
          <Link href="/news" className="topnav-link">News</Link>
          <Link href="/predict" className="topnav-link">Prediction</Link>
          <Link href="/about" className="topnav-link">About</Link>
          <Link href="/#how" className="topnav-link">How it works</Link>
          <Link href="https://github.com/iamHimanshu-07/Yugen" target="_blank" rel="noopener" className="topnav-link">
            GitHub �
          </Link>
        </nav>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/markets" className="btn btn-primary btn-sm">Open dashboard →</Link>
        </div>
      </div>
    </header>
  );
}