import type { GameRecord, Player } from "@/data/api/types";
import type { Point } from "./board";
import { opponentOf, PLAYERS } from "./players";
import type { ReplayState } from "./replayState";

/** What the player shooting at a board thinks of it: its weights as heat, and the cell it fires at next. */
export interface ShooterView {
  /** 0..1 per open cell, null on cells shot already. Null as a whole when the shooter weighs nothing. */
  heat: (number | null)[] | null;
  /** Set when the very next shot of the game lands on this board. */
  chosen: Point | null;
}

/** Raises the spread weights, so that the few likely cells stand out from the many that are merely possible. */
const SHARPNESS = 2;

/** Weights spread from the smallest to the largest weight of the open cells. */
export function weightHeat(weights: number[], shot: ReadonlySet<number>): (number | null)[] {
  const open = weights.filter((_, index) => !shot.has(index));
  const low = Math.min(...open);
  const span = Math.max(...open) - low;
  return weights.map((weight, index) => {
    if (shot.has(index)) return null;
    return span > 0 ? ((weight - low) / span) ** SHARPNESS : 0;
  });
}

/**
 * The views after `position` shots, keyed by the owner of the board looked at. The weights are those of the
 * shooter's next shot, which it formed from every shot it has fired so far.
 */
export function shooterViews(game: GameRecord, position: number, state: ReplayState): Record<Player, ShooterView> {
  const viewOf = (owner: Player): ShooterView => {
    const shooter = opponentOf(owner);
    const upcoming = game.shots.slice(position).find((shot) => shot.player === shooter);
    const shot = new Set(state.boards[owner].marks.keys());
    const { next } = state;
    return {
      heat: upcoming?.weights ? weightHeat(upcoming.weights, shot) : null,
      chosen: next !== null && next.player === shooter ? { x: next.x, y: next.y } : null,
    };
  };
  const [one, two] = PLAYERS.map(viewOf);
  return { ONE: one, TWO: two };
}

/** Whether any shot of the game says what its shooter weighed. A log and a human never do. */
export const hasWeights = (game: GameRecord): boolean => game.shots.some((shot) => shot.weights !== null);
