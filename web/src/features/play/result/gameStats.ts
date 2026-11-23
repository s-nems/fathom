import type { GameRecord, Player } from "@/data/api/types";

/** What one player did in a game, counted from its shots. */
export interface PlayerStats {
  shots: number;
  hits: number;
  shipsSunk: number;
  /** Hits per shot, 0 when the player never shot. */
  accuracy: number;
}

export function playerStats(game: GameRecord, player: Player): PlayerStats {
  const shots = game.shots.filter((shot) => shot.player === player);
  const hits = shots.filter((shot) => shot.result !== "MISS").length;
  return {
    shots: shots.length,
    hits,
    shipsSunk: shots.filter((shot) => shot.result === "SUNK").length,
    accuracy: shots.length > 0 ? hits / shots.length : 0,
  };
}
