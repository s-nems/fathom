import { wholeNumber } from "@/lib/format";

const WHOLE_NUMBER = /^-?\d+$/;

/** The number a draft stands for while it is typed: a whole number within the bounds, or null. */
export function typedNumber(draft: string, min: number, max: number): number | null {
  const text = draft.trim();
  if (!WHOLE_NUMBER.test(text)) return null;
  const value = Number(text);
  return value >= min && value <= max ? value : null;
}

/** The number a draft is settled to when the field is left: brought within the bounds, or the last value. */
export const settledNumber = (draft: string, last: number, min: number, max: number): number =>
  wholeNumber(draft, last, min, max);
