import { clamp } from "./number";

/** The two ends of a colour ramp. */
export interface HeatScale {
  low: number;
  high: number;
}

const MIDDLE = 0.5;
const FIRST_QUARTILE = 0.25;
const THIRD_QUARTILE = 0.75;

/** How many widths of the middle half a value may lie beyond it before it counts as an outlier (Tukey's fences). */
const FENCE_WIDTHS = 1.5;

/** The value below which the share `p` of the sorted values lies, between neighbours when it falls between them. */
export function percentile(sorted: number[], p: number): number {
  const at = p * (sorted.length - 1);
  const below = Math.floor(at);
  const above = Math.ceil(at);
  return sorted[below] + (sorted[above] - sorted[below]) * (at - below);
}

/**
 * A scale over the values that are not outliers: from the smallest to the largest value within one and a half
 * widths of the middle half. One extreme value then does not take the whole ramp.
 */
export function robustScale(values: number[]): HeatScale {
  const sorted = [...values].sort((a, b) => a - b);
  const first = percentile(sorted, FIRST_QUARTILE);
  const third = percentile(sorted, THIRD_QUARTILE);
  const reach = (third - first) * FENCE_WIDTHS;
  const within = sorted.filter((value) => value >= first - reach && value <= third + reach);
  return { low: within[0], high: within[within.length - 1] };
}

/** Where a value sits on a scale, 0..1. Values beyond an end take that end, a scale without width its middle. */
export function onScale(value: number, scale: HeatScale): number {
  const span = scale.high - scale.low;
  if (span <= 0) return MIDDLE;
  return clamp((value - scale.low) / span, 0, 1);
}
