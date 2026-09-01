# Yugen ◬

> A live, no-account crypto dashboard for the 21 coins that actually move the market.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev) [![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org) [![License](https://img.shields.io/badge/license-MIT-blue)](#license) [![Vercel](https://img.shields.io/badge/deploy-Vercel-000)](https://vercel.com)

**Live demo →** [yugen-x.vercel.app](https://yugen-x.vercel.app)

---

## 🌑 About Yugen

**Yugen** is a Japanese aesthetic principle — the awareness that the most important things in a scene are the ones not in the foreground. A mountain hidden by mist. The pause before a phrase. The supply behind a price.

Most crypto dashboards suffer from two failure modes:
1. **The Trading-Terminal Trap**: Spinning numbers, dense indicators, and a deluge of noise that creates an illusion of control while obscuring the actual price action.
2. **The Research Notebook Trap**: Slow, ugly, auth-walled interfaces that often hide fake or simulated data behind a "professional" curtain.

**Yugen is the third path.** It combines the visual polish of a modern product with the data integrity of a research tool and the openness of a public utility. It is a dashboard that knows what to leave out, shifting the focus from *what* is happening to *why* it is happening.

### ◬ Read the Depth
We don't just show the price candle; we surface the underlying signals that drive the market:
- **Funding Rates**: Live bias detection from Binance Futures to spot over-leveraged positions.
- **Liquidity Depth**: Exit capacity analysis via DexScreener to identify liquidity traps.
- **Social Pulse**: Real-time community sentiment aggregated from raw Reddit data.
- **Relative Normalization**: A comparison engine that snaps assets to a 100% baseline, allowing you to compare $60k BTC vs $0.10 DOGE on the same axis.

---

## ⚡ Highlights

- **Edge-First Architecture** — Next.js 16 Server Components deployed on Vercel for sub-500ms loads.
- **Verifiable Data** — Every single value traces back to a public, free data source (CoinGecko, Reddit, Binance, DexScreener). No black boxes.
- **21-Coin Catalog** — A curated selection of L1s, Stables, Privacy coins, and Memes that actually move the needle.
- **Zero Friction** — No accounts, no API keys, no sign-ups. Open the link, read the depth.
- **Premium Aesthetic** — A hand-rolled design system using a `#0A0B0F` deep-dark palette and the signature Yugen glyph `◬`.

---

## 🛠 Technical Architecture

### The Pipeline
Yugen is engineered for extreme transparency and speed.
`Request` $\rightarrow$ `Edge Runtime` $\rightarrow$ `Multi-API Fallback` $\rightarrow$ `Single-Flight Coalescing` $\rightarrow$ `SSG Revalidation (60s)` $\rightarrow$ `Client Render`.

### Core Features
- **Markets (`/markets`)**: A high-performance grid with live search, kind-filtering, and 7-day sparklines.
- **Coin Detail (`/coin/[id]`)**: A dedicated dashboard per coin featuring professional KPI blocks and a normalized price chart.
- **Comparison Engine (`/compare`)**: A relative performance tool that normalizes all price series to 100 at the start of the range.
- **How It Works (`/how-it-works`)**: A dedicated technical breakdown of the data pipeline and architectural choices.

---

## 📦 Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.3** | App Router, Server Components, Edge Runtime |
| Runtime | **React 19.2** | Server-first rendering, dynamic client imports |
| Styling | **Tailwind CSS v4** | `@theme` inline tokens, zero config |
| Charts | **Apache ECharts** | High-performance canvas rendering for time-series |
| Data | **Multi-Source** | CoinGecko, Reddit, Binance, DexScreener |
| Deploy | **Vercel** | Global Edge Network, automatic ISR revalidation |

---

## 🔍 Data Sources

```
Price / Market Cap / Supply  →  CoinGecko (Multi-API Fallback)
Social Feed                  →  Reddit JSON API (Server-side UA)
Funding Rates                →  Binance Futures API
Liquidity Depth              →  DexScreener API
```

---

## 📂 Project Structure

```
yugen/
├── app/
│   ├── layout.tsx              # Root layout, watermark shell, async footer
│   ├── page.tsx                # Landing page (Manifesto + KPI strip)
│   ├── about/page.tsx          # The Yugen Manifesto
│   ├── how-it-works/page.tsx   # Technical architecture guide
│   ├── markets/page.tsx        # 21-coin catalog index
│   ├── coin/[id]/              # Per-coin detailed dashboards
│   └── api/                    # Route handlers for charts and data proxies
├── components/
│   ├── nav.tsx                 # Sticky blurred top navigation
│   ├── coin-detail/            # Specialized KPI, Chart, and Feed components
│   └── market/                 # Catalog grid and filtering logic
└── lib/
    ├── coingecko.ts            # Server-side fetchers with parallel fallback
    ├── exchange.ts             # Professional signals (Funding/Liquidity)
    ├── coins.ts               # Authoritative 21-coin catalog
    └── utils.ts               # Formatting and deterministic hashing
```

---

## 🚀 Run & Deploy

```bash
npm install
npm run dev    # Local development (http://localhost:3000)
npm run build  # Static generation of all 21 coin pages
```

**Production:** Deployed on Vercel at [yugen-x.vercel.app](https://yugen-x.vercel.app).

---

## 🗺 Roadmap

Our rule: **Don't add anything that requires a key, an account, or opaque weighting.**

- [ ] Expand sentiment analysis to broader social datasets.
- [ ] Implement public RSS alerts for unusual volume/volatility.
- [ ] Refine the Relative Normalization engine for multi-year comparisons.

---

## ⚖️ License

MIT — see [`LICENSE`](./LICENSE).

**Acknowledgments:**
- Data: [CoinGecko](https://www.coingecko.com), [Reddit](https://www.reddit.com), [Binance](https://www.binance.com), [DexScreener](https://dexscreener.com)
- Charting: [Apache ECharts](https://echarts.apache.org/)
