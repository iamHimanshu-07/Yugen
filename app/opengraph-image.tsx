/**
 * Landing-page OpenGraph image. Next.js auto-serves this at
 * /opengraph-image.png. Uses ImageResponse (Satori) under the hood, which
 * only supports a subset of CSS — flexbox, solid colors, no gradients, no
 * grid, no text-overflow. Every direct-child div must declare display.
 */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Yugen — read the depth";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Bundle Noto Sans Symbols 2 so Satori can render the brand glyphs (₿ ◎ ◬
 * etc.) in the OG card without trying to fetch a fallback from Google Fonts.
 * The default Satori font doesn't cover these codepoints; without this we'd
 * see "Failed to load dynamic font" warnings at build time and tofu boxes in
 * the rendered PNG.
 */
async function loadSymbolsFont(): Promise<Buffer> {
  const path = join(process.cwd(), "app", "fonts", "NotoSansSymbols2-Regular.ttf");
  return readFile(path);
}

export default async function OG() {
  const symbols = await loadSymbolsFont();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          backgroundColor: "#0A0B0F",
          fontFamily: "sans-serif",
          color: "#F5F7FA",
        }}
      >
        {/* TOP ROW: wordmark + LIVE pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#FF6A1A",
              color: "#0A0B0F",
              fontSize: 32,
              fontWeight: 800,
              fontFamily: "Symbols",
            }}
          >
            ◬
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -2 }}>Yugen</div>
          <div
            style={{
              marginLeft: 12,
              paddingLeft: 14,
              paddingRight: 14,
              paddingTop: 6,
              paddingBottom: 6,
              borderRadius: 999,
              border: "1px solid #16C784",
              color: "#16C784",
              fontSize: 14,
              fontWeight: 700,
              backgroundColor: "#16C7841A",
              display: "flex",
              alignItems: "center",
            }}
          >
            ● Live
          </div>
        </div>

        {/* MIDDLE: eyebrow + headline + sub */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 4,
              color: "#FF6A1A",
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Read the depth
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.05,
              marginTop: 18,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex" }}>14 coins. Live price,</div>
            <div style={{ color: "#FF8E3C", display: "flex" }}>real sentiment.</div>
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#8A93A6",
              lineHeight: 1.4,
              marginTop: 20,
              maxWidth: 900,
              display: "flex",
            }}
          >
            Price, supply, and what people are saying — without API keys or fake data.
          </div>
        </div>

        {/* BOTTOM ROW: coin chips + URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 20,
            borderTop: "1px solid #FFFFFF1A",
            color: "#5C6479",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex", gap: 28 }}>
            <div style={{ display: "flex", fontFamily: "Symbols" }}>Bitcoin ₿</div>
            <div style={{ display: "flex", fontFamily: "Symbols" }}>Ethereum Ξ</div>
            <div style={{ display: "flex", fontFamily: "Symbols" }}>Solana ◎</div>
            <div style={{ display: "flex" }}>+ 11 more</div>
          </div>
          <div style={{ color: "#FF6A1A", display: "flex" }}>yugen-crypto.vercel.app →</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Symbols", data: symbols, weight: 400, style: "normal" },
      ],
    },
  );
}