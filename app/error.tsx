/**
 * Root error boundary — catches failures from CoinGecko / Reddit fetches and
 * any uncaught exceptions from the route tree. Renders a brand-styled
 * recovery card with a reset button.
 */
"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to whatever monitoring the user wires up later. Console only for now.
    console.error("Yugen route error:", error);
  }, [error]);

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
      <div className="hero-eyebrow" style={{ marginBottom: 24, color: "var(--bear)" }}>
        <span className="dot" style={{ background: "var(--bear)", boxShadow: "0 0 8px var(--bear)" }} />
        <span style={{ color: "var(--bear)" }}>upstream hiccup</span>
      </div>

      <h1
        className="h-display"
        style={{
          fontSize: "clamp(40px, 6vw, 72px)",
          maxWidth: 800,
          margin: 0,
        }}
      >
        We hit a depth we
        <br />
        <span
          style={{
            background: "linear-gradient(90deg, var(--bear) 0%, #ff7b6e 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          can&apos;t read.
        </span>
      </h1>

      <p
        style={{
          marginTop: 24,
          maxWidth: 560,
          color: "var(--muted)",
          fontSize: 16,
          lineHeight: 1.6,
        }}
      >
        CoinGecko or Reddit is unreachable from this edge. Your data will return
        when they do — or you can browse the rest of the catalog while we wait.
      </p>

      {error.digest && (
        <div
          style={{
            marginTop: 18,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: "var(--panel)",
            color: "var(--dim)",
            fontSize: 12,
            fontFamily: "var(--font-jetbrains), monospace",
            letterSpacing: "0.04em",
          }}
        >
          ref · {error.digest}
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          display: "flex",
          gap: 12,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => reset()}
          className="btn btn-primary"
          style={{ height: 52, padding: "0 24px", fontSize: 15 }}
        >
          Try again →
        </button>
        <Link
          href="/markets"
          className="btn btn-ghost"
          style={{ height: 52, padding: "0 24px", fontSize: 15 }}
        >
          Browse markets
        </Link>
      </div>
    </section>
  );
}