/** What a histogram of shots to sink a fleet says at a glance. */
export interface HistogramStats {
  games: number;
  median: number;
  fastest: number;
  slowest: number;
}

const HALF = 0.5;

/** The first and last shot counts that occur in a histogram, or null when it is empty. */
export function occupiedRange(histogram: number[]): { first: number; last: number } | null {
  const first = histogram.findIndex((games) => games > 0);
  if (first < 0) return null;
  return { first, last: histogram.findLastIndex((games) => games > 0) };
}

/** The stats of `histogram[n] = games that took n shots`, or null when it counts no game. */
export function histogramStats(histogram: number[]): HistogramStats | null {
  const range = occupiedRange(histogram);
  if (range === null) return null;
  const games = histogram.reduce((sum, count) => sum + count, 0);
  let seen = 0;
  const median = histogram.findIndex((count) => (seen += count) >= games * HALF);
  return { games, median, fastest: range.first, slowest: range.last };
}
