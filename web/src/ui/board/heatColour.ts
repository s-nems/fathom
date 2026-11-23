import { clamp } from "@/lib/number";

/** The ramp heat maps are coloured with, and the ink that stays readable on each of its colours. */

type Rgb = readonly [number, number, number];

/** From deep water to shallow: the colours of a bathymetric chart at night. */
const STOPS: readonly Rgb[] = [
  [27, 56, 85],
  [74, 159, 212],
  [215, 240, 255],
];

const LIGHT_INK: Rgb = [238, 243, 248];
const DARK_INK: Rgb = [4, 18, 31];

const CHANNEL_MAX = 255;
/** The constants of relative luminance and contrast as WCAG defines them. */
const LINEAR_BELOW = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_DIVISOR = 1.055;
const GAMMA = 2.4;
const LUMINANCE_SHARES: Rgb = [0.2126, 0.7152, 0.0722];
const CONTRAST_OFFSET = 0.05;

export type HeatInk = "light" | "dark";

function rgbAt(t: number): Rgb {
  const at = clamp(t, 0, 1) * (STOPS.length - 1);
  const below = Math.min(STOPS.length - 2, Math.floor(at));
  const share = at - below;
  const [from, to] = [STOPS[below], STOPS[below + 1]];
  return [0, 1, 2].map((channel) =>
    Math.round(from[channel] + (to[channel] - from[channel]) * share),
  ) as unknown as Rgb;
}

const css = ([r, g, b]: Rgb): string => `rgb(${r} ${g} ${b})`;

function luminance(colour: Rgb): number {
  return colour
    .map((channel) => channel / CHANNEL_MAX)
    .map((value) =>
      value <= LINEAR_BELOW ? value / LINEAR_DIVISOR : ((value + GAMMA_OFFSET) / GAMMA_DIVISOR) ** GAMMA,
    )
    .reduce((sum, value, channel) => sum + value * LUMINANCE_SHARES[channel], 0);
}

/** The contrast ratio of two colours, 1 for none and 21 for black on white. */
function contrast(one: Rgb, other: Rgb): number {
  const [dark, light] = [luminance(one), luminance(other)].sort((a, b) => a - b);
  return (light + CONTRAST_OFFSET) / (dark + CONTRAST_OFFSET);
}

/** The colour of a value 0..1 on the ramp. */
export const heatColour = (t: number): string => css(rgbAt(t));

/** The ink that contrasts more with the colour of the value. */
export function heatInk(t: number): HeatInk {
  const ground = rgbAt(t);
  return contrast(ground, LIGHT_INK) >= contrast(ground, DARK_INK) ? "light" : "dark";
}

/** The contrast the chosen ink has on the colour of the value. */
export function inkContrast(t: number): number {
  const ground = rgbAt(t);
  return Math.max(contrast(ground, LIGHT_INK), contrast(ground, DARK_INK));
}

/** The whole ramp as a CSS gradient, for a legend. */
export const HEAT_GRADIENT = `linear-gradient(90deg, ${STOPS.map(css).join(", ")})`;
