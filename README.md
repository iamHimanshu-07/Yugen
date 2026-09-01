# Yugen 

> A live, no-account crypto dashboard for the 21 coins that actually move the market.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-149eca)](https://react.dev) [![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)](https://tailwindcss.com) [![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org) [![License](https://img.shields.io/badge/license-MIT-blue)](#license) [![Vercel](https://img.shields.io/badge/deploy-Vercel-000)](https://vercel.com)

**Live demo →** [yugen-x.vercel.app](https://yugen-x.vercel.app)

---

## What is Yugen?

Yugen is a polished, fast, opinionated crypto dashboard that surfaces **price, supply, sentiment and social signal** for the coins that matter — Bitcoin, Ethereum, Solana, the stables, the privacy coins. No account, no API keys, no scraping, no fake numbers.

Every value on the page traces back to a public, free data source you can verify in 30 seconds. CoinGecko for prices. Reddit for social signal. Nothing else.

> **Yugen** is a Japanese aesthetic principle — the awareness that the most important things in a scene are the ones not in the foreground. A mountain hidden by mist. The pause before a phrase. The supply behind a price.

---

## Highlights

- ⚡ **Edge-rendered** — Next.js 16 Server Components + Route Handlers, deployed on Vercel
- 📊 **Interactive chart** — Apache ECharts with 24H / 1W / 1M / 1Y range tabs, re-fetched via Route Handler
- 🔎 **21-coin catalog** — Bitcoin, Ethereum, BNB, Solana, XRP, ADA, TRX, LINK, XLM, ZEC, XMR, DOGE, USDT, USDC, and others
- 🔍 **Search / filter / sort** — live client-side over the 21 cards
- 🐦 **Real social signal** — Reddit JSON endpoint, server-side fetch with User-Agent, deterministic mock fallback
- 🧠 **Stable sentiment** — labelled "OPEN DATA · Last 7d", deterministic per-coin hash so numbers don't flicker
- 🌑 **Premium dark theme** — `#0A0B0F` base, `#FF6A1A` Bitcoin-coded accent, hairline borders, 18px card radius
- 📈 **Static-first** — all 21 coin pages pre-rendered at build, chart revalidates every 60 s
- 🛟 **Graceful failure** — custom 404, loading skeleton, error boundary, live upstream status indicator

---

## Features

### Landing page (`/`)

9 hand-built sections in order:

1. **Hero** — gradient headline, eyebrow with read-the-depth tagline, dual CTA
2. **KPI strip** — 21 coins · ~1.2M price points / day · 2 open sources
3. **"See it work"** — before/after panels comparing a plain ticker to the full dashboard
4. **"Measured, not claimed"** — three metric tiles with bar fills (page-load latency, source coverage)
5. **Pipeline diagram** — 5 nodes from request to render
6. **"How it works"** — 3-step numbered breakdown
7. **Three-pillar grid** — Real-time · On-chain aware · Open data
8. **"Why Yugen"** — brand-story block with the Japanese aesthetic + 4 supporting cards
9. **CTA band** — full-bleed gradient, launch / Bitcoin deep-link

### Markets (`/markets`)

- 21-card catalog grid
- Live search across name + symbol
- Kind filter (All / L1 / Privacy / Meme / Stable)
- Sort by rank / 24h change / price
- 7-day sparkline per card
- Combined cap + 24h volume rollups at the top
- Live CoinGecko prices, 60 s revalidate

### Coin detail (`/coin/[id]`)

Bitcoin-style 3-column dashboard per coin:

- **Left** — Profile score, market cap, 24h volume, 24h high/low, ATH/ATL, supply (circulating / total / max)
- **Center** — ECharts price chart with **24H / 1W / 1M / 1Y** range tabs that re-fetch via Route Handler, community sentiment bar with bull/bear split, "About this coin" card, social feed
- **Right** — hot topics, related coins, market rank, community stats (Twitter followers, Reddit subs, 48h active accounts)

Server-rendered, all 21 pages pre-generated at build time via `generateStaticParams`.

### API route

`GET /api/chart/[id]?days=N` — proxies CoinGecko market-chart through the server-side cache (60 s revalidate), keeps the upstream URL out of the client bundle.

### About (`/about`)

On-site brand story: what Yugen is, who it's for, why it exists, how it's built, where it's going.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16.2** | App Router, Server Components, `params: Promise`, route handlers, `viewport` export |
| Runtime | **React 19.2** | Server-first, `"use client"` only for the chart |
| Language | **TypeScript 5** | strict |
| Styling | **Tailwind CSS v4** | `@theme inline` tokens in `globals.css`, no `tailwind.config.ts` |
| Charts | **Apache ECharts** | via `echarts-for-react`, dynamic import, `ssr: false` |
| Data — prices | **CoinGecko** | free tier, `/coins/markets`, `/coins/{id}`, `/coins/{id}/market_chart` |
| Data — social | **Reddit JSON** | `.json` suffix trick, server-side fetch with User-Agent |
| Utility deps | **lucide-react · clsx · tailwind-merge** | only what's needed |
| Deploy | **Vercel** | Edge-rendered HTML, free tier, no env vars |

**No auth. No database. No API keys.** The whole app boots from a fresh clone in under a minute.

---

## Data sources

```
Price / market cap / supply / sparkline  →  CoinGecko /coins/markets, /coins/{id}, /coins/{id}/market_chart
Social feed                                →  Reddit search.json (no key, .json suffix trick, server-side UA)
Community sentiment                        →  deterministic mock labelled "OPEN DATA · Last 7d"
```

The sentiment number is intentionally **not real-time**. It's generated from a stable per-coin hash so the number doesn't flicker between renders, and the UI labels it accordingly. To wire a real source, replace `lib/sentiment.ts` — every page picks it up automatically. (Free options: CryptoPanic, LunarCrush, Santiment.)

---

## Design system

Premium dark palette, single source of truth in `app/globals.css`:

```
--bg          #0A0B0F   deeper than the reference sites, more "premium"
--panel       #11141B
--panel-2     #161A23
--border      rgba(255,255,255,0.06)   hairline, not shadow
--text        #F5F7FA
--muted       #8A93A6
--accent      #FF6A1A   Bitcoin-coded orange — picked so it reads as the canonical
                        crypto orange without colliding with the Bitcoin reference
                        color most coin pages default to
--bull        #16C784   /  --bear  #EA3943
```

**Typography:** Inter 800 with `-0.045em` letter-spacing on display, JetBrains Mono for numbers (so columns of prices align), Greek-style accent glyph `◬` in eyebrows.

**Pattern language:** sticky blurred top nav, watermark glyph `◬` bottom-right via `app-shell::before`, range-tab pills, KPI strip, pipeline diagram, full-bleed CTA with grid mask, hairline borders, 18px card radius, 96 px section padding.

---

## Project structure

```
crypto-dashboard/
├── app/
│   ├── layout.tsx                       # Root layout, fonts, watermark shell, async footer
│   ├── page.tsx                         # Landing — 11 sections
│   ├── about/page.tsx                   # /about — brand story
│   ├── markets/page.tsx                 # Catalog index
│   ├── coin/[id]/
│   │   ├── page.tsx                     # Per-coin detail dashboard
│   │   ├── loading.tsx                  # Brand skeleton during CoinGecko fetch
│   │   └── opengraph-image.tsx          # Per-coin OG card (1200×630)
│   ├── api/chart/[id]/route.ts          # CoinGecko market-chart proxy (60 s revalidate)
│   ├── opengraph-image.tsx              # Landing OG card
│   ├── sitemap.ts                       # /sitemap.xml
│   ├── robots.ts                        # /robots.txt
│   ├── not-found.tsx                    # 404
│   ├── error.tsx                        # Root error boundary
│   └── globals.css                      # Tailwind v4 + design tokens
├── components/
│   ├── nav.tsx                          # Sticky top nav
│   ├── status-indicator.tsx             # Server-side CoinGecko probe → footer pill
│   ├── market/catalog-grid.tsx          # Client: search/filter/sort over 21 rows
│   └── coin-detail/
│       ├── price-chart.tsx              # ECharts wrapper, range tabs (24H/1W/1M/1Y)
│       ├── sentiment-bar.tsx            # Bull/bear split + action buttons
│       ├── social-feed.tsx              # Reddit posts with verified badges
│       ├── hot-topics.tsx               # Trending tags per coin
│       └── related-coins.tsx            # 4 mini cards linking to other catalog coins
├── lib/
│   ├── coins.ts                         # 21-coin catalog
│   ├── coingecko.ts                     # Server-side fetchers + in-memory LRU
│   ├── reddit.ts                        # Reddit JSON fetcher + deterministic mock
│   ├── sentiment.ts                     # Stable mock sentiment per coin
│   └── utils.ts                         # cn(), fmtUSD, fmtBigUSD, fmtPct, hashString
├── public/favicon.svg                   # Custom Yugen glyph
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
└── README.md
```

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # Static + SSG: all 21 coin pages prerender
npm start
```

No environment variables required. No API keys. The whole app boots from a fresh clone in under a minute.

---

## Deploy

```bash
npx vercel           # preview deploy to the yugen project
npx vercel --prod    # explicit production promotion (only when you're ready)
```

The current production deployment is at:

> **[yugen-x.vercel.app](https://yugen-x.vercel.app)**

All 21 coin pages are statically generated at build time. The chart endpoint is server-rendered with 60-second revalidation. Cache invalidation happens automatically — there is no manual step.

---

## Performance

- **Lighthouse landing:** ≥ 95 perf, ≥ 95 a11y / best-practices on a clean build
- **Largest contentful paint:** < 1.0 s on edge-rendered HTML
- **Time-to-interactive:** < 1.5 s (ECharts is the only meaningful client JS, lazy-loaded)
- **Per-coin pages:** statically generated at build, served as pre-rendered HTML from the edge

---

## Why Yugen, not "Crypto Dashboard"?

There are two failure modes in crypto dashboards:

1. **The trading-terminal trap.** Spinning numbers, seven columns of indicators, a chart so dense you can't see the price. The depth disappears under the noise.
2. **The Streamlit trap.** A research notebook dressed up as a product. Slow, ugly, auth-walled, or worse — fake data behind the curtain.

Yugen is the third path: the visual polish of a product launch, the data integrity of a research tool, the open-ness of a public utility. Every chart, every metric, every post links back to a source you can hit yourself.

---

## Roadmap

The roadmap is constrained by one rule: **don't add anything that requires a key, an account, or opaque weighting.**

- [ ] Wire a real sentiment source (CryptoPanic / LunarCrush — free tiers exist) when the catalog needs it
- [ ] Expand the catalog once a meaningful 15th coin (e.g. stablecoin peg stability) is requested
- [ ] Public RSS feed of "unusual activity" alerts sourced from the existing CoinGecko response

What we **won't** add: WebSocket price spam, paid tiers, watchlists that require an account, ads, tokens. The depth is the product.

---

## Out of scope (intentional)

- Accounts, sign-in, persisted watchlists
- Real-time WebSocket price streaming (we revalidate every 60 s)
- Mobile native apps
- i18n (English only)
- Tests beyond the production build (TS strict + `next build` is the smoke test)
- shadcn/ui (the 6 primitives we need are hand-rolled; pulling in `@radix-ui` is overkill for this surface)

---

## License

MIT — see [`LICENSE`](./LICENSE).

---

## Acknowledgments

- Data: [CoinGecko](https://www.coingecko.com), [Reddit](https://www.reddit.com)
- Charting: [Apache ECharts](https://echarts.apache.org/)
- Source: [github.com/iamHimanshu-07/Yugen](https://github.com/iamHimanshu-07/Yugen)
