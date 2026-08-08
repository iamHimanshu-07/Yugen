/**
 * tab-strip.tsx — Tab navigation strip shared by /coin/[id] sub-pages.
 *
 * Client component: uses usePathname() to compute the active tab. Rendered
 * below the CoinHeader on every coin sub-page. Links navigate to:
 *   /coin/[id]            — Chart (current main page)
 *   /coin/[id]/markets    — Markets
 *   /coin/[id]/news       — News
 *   /coin/[id]/discussions— Discussions
 *   /coin/[id]/about      — About
 *
 * "Backtest" tab was intentionally dropped — no backend exists.
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { label: string; suffix: string }[] = [
  { label: "Chart", suffix: "" },
  { label: "Markets", suffix: "/markets" },
  { label: "News", suffix: "/news" },
  { label: "Discussions", suffix: "/discussions" },
  { label: "About", suffix: "/about" },
];

interface TabStripProps {
  basePath: string; // e.g. "/coin/bitcoin"
}

export function TabStrip({ basePath }: TabStripProps) {
  const pathname = usePathname();
  // Normalize: drop trailing slash for comparison
  const current = (pathname ?? "").replace(/\/$/, "");

  return (
    <div
      className="tab-strip"
      style={{ maxWidth: 1320, margin: "0 auto", padding: "0 24px" }}
    >
      {TABS.map((t) => {
        const href = `${basePath}${t.suffix}`;
        const isActive = current === href.replace(/\/$/, "");
        return (
          <Link
            key={t.label}
            href={href}
            className={`tab${isActive ? " active" : ""}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}