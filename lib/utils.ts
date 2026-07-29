/**
 * utils.ts — tiny class-name helper + formatters shared across pages.
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----- formatters ----- */

export function fmtUSD(value: number | null | undefined, decimals = 2): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function fmtBigUSD(value: number | null | undefined): string {
  if (value == null || value === 0 || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `$${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `$${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export function fmtPct(value: number | null | undefined, signed = true): string {
  if (value == null || Number.isNaN(value)) return "—";
  const s = signed && value > 0 ? "+" : "";
  return `${s}${value.toFixed(2)}%`;
}

export function fmtInt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return Math.round(value).toLocaleString("en-US");
}

export function fmtCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9)  return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6)  return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3)  return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString("en-US");
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const t = typeof iso === "number" ? iso : new Date(iso).getTime();
    if (Number.isNaN(t)) return "";
    const sec = (Date.now() - t) / 1000;
    if (sec < 60) return "just now";
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86_400) return `${Math.floor(sec / 3600)}h ago`;
    if (sec < 604_800) return `${Math.floor(sec / 86_400)}d ago`;
    return new Date(t).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

/** Soft "percent color" class (bull/bear). */
export function pctColor(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "delta-flat";
  return pct >= 0 ? "delta-up" : "delta-down";
}

/** FNV-1a string hash — used for deterministic mocks. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}