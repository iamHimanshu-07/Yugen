/**
 * indicators.ts — pure-math technical indicators computed from price points.
 *
 * No external deps. All functions take an array of [ts_ms, price] points and
 * return a parallel array of the same length where early values are null
 * until the lookback window is satisfied.
 *
 * Series returned preserve timestamps from the input so they can be plotted
 * directly against price on the same chart.
 */

export type Point = [number, number];
export type IndicatorPoint = [number, number | null];

function extractPrices(points: Point[]): number[] {
  return points.map(([, p]) => p);
}

/**
 * Simple Moving Average over `period` points.
 * First (period-1) values are null.
 */
export function sma(points: Point[], period: number): IndicatorPoint[] {
  const prices = extractPrices(points);
  const out: IndicatorPoint[] = new Array(points.length);
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += prices[i];
    if (i >= period) sum -= prices[i - period];
    out[i] = [points[i][0], i >= period - 1 ? sum / period : null];
  }
  return out;
}

/**
 * Exponential Moving Average. Uses standard multiplier k = 2 / (period + 1)
 * and seeds the EMA with the SMA of the first `period` values.
 */
export function ema(points: Point[], period: number): IndicatorPoint[] {
  const prices = extractPrices(points);
  const out: IndicatorPoint[] = new Array(points.length);
  if (points.length < period) {
    for (let i = 0; i < points.length; i++) out[i] = [points[i][0], null];
    return out;
  }
  let seedSum = 0;
  for (let i = 0; i < period; i++) seedSum += prices[i];
  let prev = seedSum / period;
  const k = 2 / (period + 1);
  for (let i = 0; i < points.length; i++) {
    if (i < period - 1) {
      out[i] = [points[i][0], null];
    } else if (i === period - 1) {
      out[i] = [points[i][0], prev];
    } else {
      prev = prices[i] * k + prev * (1 - k);
      out[i] = [points[i][0], prev];
    }
  }
  return out;
}

/**
 * Relative Strength Index (Wilder's smoothing), output 0–100.
 * NaN/null for the first `period` values.
 */
export function rsi(points: Point[], period = 14): IndicatorPoint[] {
  const prices = extractPrices(points);
  const out: IndicatorPoint[] = new Array(points.length);
  if (points.length <= period) {
    for (let i = 0; i < points.length; i++) out[i] = [points[i][0], null];
    return out;
  }
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  for (let i = 0; i <= period; i++) out[i] = [points[i][0], null];
  // First RSI value uses simple averages; subsequent values use Wilder smoothing.
  let rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[period] = [
    points[period][0],
    avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
  ];
  for (let i = period + 1; i < points.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    out[i] = [
      points[i][0],
      avgLoss === 0 ? 100 : 100 - 100 / (1 + rs),
    ];
  }
  return out;
}
