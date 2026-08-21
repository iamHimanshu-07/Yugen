/**
 * decimate.ts — Largest-Triangle-Three-Buckets downsampling for time series.
 *
 * For chart payloads that exceed what the canvas actually needs (e.g. 730
 * daily points over 2 years, or 1440 hourly points), decimate down to a
 * target count while preserving visual peaks and troughs.
 *
 * Reference: Sveinn Steinarsson, "Downsampling Time Series for Visual
 * Representation" (MSc thesis, University of Iceland, 2013).
 */

export type Point = [number, number];

/**
 * Downsample `[ts, value]` points to at most `threshold` buckets using
 * LTTB. Returns the input unchanged when length is already below threshold.
 */
export function lttb(points: Point[], threshold: number): Point[] {
  const n = points.length;
  if (threshold >= n || threshold < 3) return points;

  const sampled: Point[] = new Array(threshold);
  const bucketSize = (n - 2) / (threshold - 2);

  sampled[0] = points[0];
  let a = 0; // index of the previously selected point

  for (let i = 0; i < threshold - 2; i++) {
    // Compute the average point of the *next* bucket (for area calculation).
    const nextStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, n);
    let avgX = 0;
    let avgY = 0;
    const len = Math.max(1, nextEnd - nextStart);
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += points[j][0];
      avgY += points[j][1];
    }
    avgX /= len;
    avgY /= len;

    // Scan the current bucket, pick the point with the largest triangle area.
    const curStart = Math.floor(i * bucketSize) + 1;
    const curEnd = Math.floor((i + 1) * bucketSize) + 1;
    const ax = points[a][0];
    const ay = points[a][1];
    let maxArea = -1;
    let maxIdx = curStart;
    for (let j = curStart; j < curEnd; j++) {
      const area = Math.abs(
        (ax - avgX) * (points[j][1] - ay) -
        (ax - points[j][0]) * (avgY - ay),
      );
      if (area > maxArea) {
        maxArea = area;
        maxIdx = j;
      }
    }
    sampled[i + 1] = points[maxIdx];
    a = maxIdx;
  }

  sampled[threshold - 1] = points[n - 1];
  return sampled;
}
