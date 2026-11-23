/** How large a run is, so that the page can say what it will cost before it starts. */

/** Games per pairing a run is offered with. The first is the default, so that a first run ends in seconds. */
export const GAME_SIZES = [20, 100, 1000] as const;
export const DEFAULT_GAMES: number = GAME_SIZES[0];

/** Games up to which a run is over in seconds even when every shooter is the bot. */
const SMALL_RUN = 400;
/** Games above which a run takes long enough to warn about. */
const LARGE_RUN = 8000;

export type RunSize = "small" | "medium" | "large";

export const SIZE_TEXT: Record<RunSize, string> = {
  small: "a few seconds",
  medium: "up to a few minutes",
  large: "ten minutes or more",
};

export const gamesInRun = (shooters: number, layouts: number, games: number): number => shooters * layouts * games;

export function runSize(games: number): RunSize {
  if (games <= SMALL_RUN) return "small";
  return games <= LARGE_RUN ? "medium" : "large";
}
