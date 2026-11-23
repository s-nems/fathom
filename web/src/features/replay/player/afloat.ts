import type { GameRecord, Player } from "@/data/api/types";
import { opponentOf } from "@/game/players";

/** A ship going down: after which shot, and whose ship it was. */
export interface Sinking {
  afterShot: number;
  owner: Player;
}

/** How a game went: the ship cells each fleet still had afloat after every shot, and when ships sank. */
export interface Course {
  /** `afloat[owner][n]` is the count after the first `n` shots, so each list is one longer than the shots. */
  afloat: Record<Player, number[]>;
  sinkings: Sinking[];
}

/** The course of a game in which every fleet starts with `fleetCells` ship cells. */
export function courseOf(game: GameRecord, fleetCells: number): Course {
  const left: Record<Player, number> = { ONE: fleetCells, TWO: fleetCells };
  const afloat: Record<Player, number[]> = { ONE: [fleetCells], TWO: [fleetCells] };
  const sinkings: Sinking[] = [];
  game.shots.forEach((shot, index) => {
    const owner = opponentOf(shot.player);
    if (shot.result !== "MISS") left[owner] = Math.max(0, left[owner] - 1);
    if (shot.result === "SUNK") sinkings.push({ afterShot: index + 1, owner });
    afloat.ONE.push(left.ONE);
    afloat.TWO.push(left.TWO);
  });
  return { afloat, sinkings };
}
