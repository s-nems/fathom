import { clamp } from "@/lib/number";

/** What a number field of the view starts with and accepts. */
export interface Bounds {
  initial: number;
  min: number;
  max: number;
}

/** Fleets drawn for a layout map. A draw of the bot's own layout is the costly one. */
export const FLEETS: Bounds = { initial: 500, min: 10, max: 20_000 };

/** Games shot for a shooter map. A game of the bot takes a good part of a second in the browser. */
export const GAMES: Bounds = { initial: 100, min: 10, max: 2_000 };

export const within = (value: number, { min, max }: Bounds): number => clamp(Math.round(value), min, max);
