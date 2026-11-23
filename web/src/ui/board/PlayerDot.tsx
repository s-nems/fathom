import type { Player } from "@/data/api/types";

const DOT: Record<Player, string> = { ONE: "dot dot-one", TWO: "dot dot-two" };

/** The colour of a side, as a small square next to its name. */
export function PlayerDot({ player }: { player: Player }) {
  return <span className={DOT[player]} aria-hidden="true" />;
}

export const INK: Record<Player, string> = { ONE: "ink-one", TWO: "ink-two" };
