import { clamp, PERCENT } from "./number";

export const percent = (share: number, digits = 1): string => `${(share * PERCENT).toFixed(digits)}%`;

export const decimal = (value: number, digits = 1): string => value.toFixed(digits);

export const plural = (count: number, noun: string): string => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** The whole number in the text, kept within the bounds, or the fallback when it is not a number. */
export function wholeNumber(text: string | undefined, fallback: number, min: number, max: number): number {
  const value = Number(text);
  if (text === undefined || text.trim() === "" || !Number.isFinite(value)) return fallback;
  return clamp(Math.round(value), min, max);
}

const MILLIS_PER_DAY = 86_400_000;
const CLOCK: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false };
const DAY: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

const dayOf = (date: Date): number => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** When something happened, as short as it stays clear: the time today, "yesterday", or the date. */
export function when(iso: string, now: Date, locale = "en-GB"): string {
  const then = new Date(iso);
  const daysAgo = Math.round((dayOf(now) - dayOf(then)) / MILLIS_PER_DAY);
  if (daysAgo === 0) return then.toLocaleTimeString(locale, CLOCK);
  return daysAgo === 1 ? "yesterday" : then.toLocaleDateString(locale, DAY);
}

/** A whole number with separators between thousands. */
export const grouped = (count: number): string => count.toLocaleString("en-US");
