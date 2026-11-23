import type { StoredGameSummary } from "@/data/api/types";

/** How a game against the bot ended for the human, who is player ONE of the games it played. */
export const humanResult = (game: Pick<StoredGameSummary, "winner">): string =>
  game.winner === null ? "no result" : game.winner === "ONE" ? "won" : "lost";
