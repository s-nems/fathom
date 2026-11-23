import type { Ending, GameResult } from "@/data/api/types";

/** How a finished game against the bot reads to the human, who is player ONE. */
export interface Outcome {
  tone: "won" | "lost" | "none";
  title: string;
  detail: string;
}

const WON_DETAIL: Record<Ending, string> = {
  FLEET_SUNK: "The enemy fleet is at the bottom.",
  ILLEGAL_MOVES: "The bot forfeited with illegal moves.",
  TIME_LIMIT: "The bot ran out of time.",
};

const LOST_DETAIL: Record<Ending, string> = {
  FLEET_SUNK: "The bot sank your fleet first.",
  ILLEGAL_MOVES: "You forfeited with illegal moves.",
  TIME_LIMIT: "You ran out of time.",
};

const ENDED_EARLY = "The game ended early.";

export function outcomeOf(result: GameResult | null): Outcome {
  if (result === null) return { tone: "none", title: "No result", detail: "The game ended without a result." };
  const won = result.winner === "ONE";
  const details = won ? WON_DETAIL : LOST_DETAIL;
  return {
    tone: won ? "won" : "lost",
    title: won ? "You won" : "You lost",
    detail: result.ending === null ? ENDED_EARLY : details[result.ending],
  };
}
