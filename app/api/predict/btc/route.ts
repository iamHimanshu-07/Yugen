/**
 * app/api/predict/btc/route.ts — Bitcoin next-day price prediction endpoint.
 *
 * Returns statistical prediction with confidence interval and methodology.
 * Cached 1 hour server-side (predictions update gradually).
 */

import { predictBtcNextDay, getPredictionDisplay } from "@/lib/prediction";

export const revalidate = 3600;

export async function GET() {
  try {
    const [prediction, display] = await Promise.all([
      predictBtcNextDay(),
      getPredictionDisplay(),
    ]);

    return Response.json({
      prediction,
      display,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "prediction failed";
    return Response.json({ error: msg }, { status: 502 });
  }
}