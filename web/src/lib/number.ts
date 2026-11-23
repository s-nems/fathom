/** Parts of a hundred in a whole. */
export const PERCENT = 100;

/** The value kept between `min` and `max`. With bounds that cross, `min` wins. */
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
