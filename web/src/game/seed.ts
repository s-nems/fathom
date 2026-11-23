import { wholeNumber } from "@/lib/format";

export const MIN_SEED = 0;
export const DEFAULT_SEED = 1;
export const MAX_SEED = 2_147_483_647;

export const randomSeed = (): number => Math.floor(Math.random() * MAX_SEED);

/** The seed written in a hash parameter, or the default. */
export const seedFrom = (text: string | undefined): number => wholeNumber(text, DEFAULT_SEED, MIN_SEED, MAX_SEED);
