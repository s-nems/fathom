import type { GameRecord } from "@/data/api/types";
import { playerStats } from "./gameStats";
import { outcomeOf } from "./outcome";

/** What the loser had done to the fleet of the winner when the last ship went down. */
export function closeness(game: GameRecord, won: boolean, fleetSize: number): string {
  if (game.result?.ending !== "FLEET_SUNK") return outcomeOf(game.result).detail;
  const loserSank = playerStats(game, won ? "TWO" : "ONE").shipsSunk;
  return won
    ? `The bot had sunk ${loserSank} of your ${fleetSize} ships.`
    : `You had sunk ${loserSank} of its ${fleetSize} ships.`;
}
