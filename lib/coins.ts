/**
 * coins.ts — 14-coin catalog.
 *
 * Single source of truth for which coins ship in the dashboard, plus their
 * display metadata (glyph, color, decimals, kind).
 *
 * `coingeckoId` is what the CoinGecko free API expects in its URL path.
 */

export type CoinKind = "l1" | "stable" | "meme" | "privacy";

export interface Coin {
  symbol: string;
  name: string;
  glyph: string;
  color: string;
  coingeckoId: string;
  decimals: number;
  kind: CoinKind;
}

export const COINS: Record<string, Coin> = {
  BTC:  { symbol: "BTC",  name: "Bitcoin",   glyph: "₿",  color: "#F7931A", coingeckoId: "bitcoin",       decimals: 0, kind: "l1" },
  ETH:  { symbol: "ETH",  name: "Ethereum",  glyph: "Ξ",  color: "#627EEA", coingeckoId: "ethereum",      decimals: 2, kind: "l1" },
  BNB:  { symbol: "BNB",  name: "BNB",       glyph: "🟡", color: "#F0B90B", coingeckoId: "binancecoin",   decimals: 2, kind: "l1" },
  SOL:  { symbol: "SOL",  name: "Solana",    glyph: "◎",  color: "#14F195", coingeckoId: "solana",        decimals: 2, kind: "l1" },
  XRP:  { symbol: "XRP",  name: "XRP",       glyph: "✕",  color: "#23292F", coingeckoId: "ripple",        decimals: 3, kind: "l1" },
  ADA:  { symbol: "ADA",  name: "Cardano",   glyph: "₳",  color: "#0033AD", coingeckoId: "cardano",       decimals: 4, kind: "l1" },
  TRX:  { symbol: "TRX",  name: "TRON",      glyph: "◆",  color: "#FF060A", coingeckoId: "tron",          decimals: 4, kind: "l1" },
  LINK: { symbol: "LINK", name: "Chainlink", glyph: "⛓",  color: "#2A5ADA", coingeckoId: "chainlink",     decimals: 3, kind: "l1" },
  XLM:  { symbol: "XLM",  name: "Stellar",   glyph: "✦",  color: "#08B5E5", coingeckoId: "stellar",       decimals: 4, kind: "l1" },
  ZEC:  { symbol: "ZEC",  name: "Zcash",     glyph: "Ⓩ",  color: "#F4B728", coingeckoId: "zcash",         decimals: 2, kind: "privacy" },
  XMR:  { symbol: "XMR",  name: "Monero",    glyph: "ɱ",  color: "#FF6600", coingeckoId: "monero",        decimals: 2, kind: "privacy" },
  DOGE: { symbol: "DOGE", name: "Dogecoin",  glyph: "Ð",  color: "#C2A633", coingeckoId: "dogecoin",      decimals: 4, kind: "meme" },
  USDT: { symbol: "USDT", name: "Tether",    glyph: "₮",  color: "#26A17B", coingeckoId: "tether",        decimals: 4, kind: "stable" },
  USDC: { symbol: "USDC", name: "USD Coin",  glyph: "$",  color: "#2775CA", coingeckoId: "usd-coin",      decimals: 4, kind: "stable" },
  AVAX: { symbol: "AVAX", name: "Avalanche", glyph: "🔺",  color: "#E84142", coingeckoId: "avalanche-gox", decimals: 2, kind: "l1" },
  SHIB: { symbol: "SHIB", name: "Shiba Inu",  glyph: "🐕",  color: "#FFA500", coingeckoId: "shiba-inu",    decimals: 6, kind: "meme" },
  DOT:  { symbol: "DOT",  name: "Polkadot",  glyph: "●",  color: "#E6007A", coingeckoId: "polkadot",      decimals: 4, kind: "l1" },
  POL:  { symbol: "POL",  name: "Polygon",    glyph: "🟣",  color: "#8247E5", coingeckoId: "polygon-ecosystem-token", decimals: 4, kind: "l1" },
  BCH:  { symbol: "BCH",  name: "Bitcoin Cash", glyph: "₿", color: "#00CC66", coingeckoId: "bitcoin-cash",  decimals: 2, kind: "l1" },
  LTC:  { symbol: "LTC",  name: "Litecoin",   glyph: "Ł",  color: "#345D9D", coingeckoId: "litecoin",      decimals: 4, kind: "l1" },
  NEAR: { symbol: "NEAR", name: "Near",       glyph: "N",  color: "#000000", coingeckoId: "near-protocol", decimals: 4, kind: "l1" },
};

export function getCoin(symbol: string): Coin | undefined {
  return COINS[symbol.toUpperCase()];
}

export function getCoinByGeckoId(id: string): Coin | undefined {
  return Object.values(COINS).find((c) => c.coingeckoId === id);
}

export function listCoins(): Coin[] {
  return Object.values(COINS);
}

export function isSupported(symbol: string): boolean {
  return !!COINS[symbol.toUpperCase()];
}

export const CATALOG_SIZE = Object.keys(COINS).length;