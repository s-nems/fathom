import type { Player, Ship } from "@/data/api/types";
import { Board } from "@/ui/board/Board";
import { FleetPips } from "@/ui/board/FleetPips";
import { HeatLayer } from "@/ui/board/HeatLayer";
import { MarksLayer } from "@/ui/board/MarksLayer";
import { INK, PlayerDot } from "@/ui/board/PlayerDot";
import { RingLayer } from "@/ui/board/RingLayer";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import type { Point } from "@/game/board";
import { sameShip } from "@/game/fleet";
import type { SideName } from "@/game/players";
import type { BoardState } from "@/game/replayState";
import type { ShooterView } from "@/game/shooterView";

interface GameBoardProps {
  owner: Player;
  name: SideName;
  /** The short name of the player shooting at this board. */
  shooter: string;
  /** The ships of the owner as far as they are known. */
  ships: Ship[];
  state: BoardState;
  /** The view of the shooter, or null to show the fleet. */
  view: ShooterView | null;
  fleet: number[];
  /** The latest shot of the game when it landed here. */
  latest: Point | null;
}

/** One side of a replay: whose fleet it is, the board, and the count of what it took. */
export function GameBoard({ owner, name, shooter, ships, state, view, fleet, latest }: GameBoardProps) {
  const afloat = ships.filter((ship) => !state.sunk.some((sunk) => sameShip(sunk, ship)));
  const hits = [...state.marks.values()].filter((result) => result !== "MISS").length;
  const ground = view?.heat ? <HeatLayer values={view.heat} /> : undefined;

  return (
    <div className="replay-side-board">
      <div className="replay-player">
        <PlayerDot player={owner} />
        <span className={`replay-player-who ${INK[owner]}`}>{name.short}</span>
        <span className="replay-player-name">{name.detail}</span>
        <FleetPips fleet={fleet} sunk={state.sunk.map((ship) => ship.size)} />
      </div>
      <Board title={`${name.fleet}, shot at by ${shooter}`} ground={ground}>
        {view === null && <ShipsLayer ships={afloat} />}
        <ShipsLayer ships={state.sunk} tone="sunk" />
        <MarksLayer marks={state.marks} />
        {latest && <RingLayer x={latest.x} y={latest.y} kind="latest" />}
        {view?.chosen && <RingLayer x={view.chosen.x} y={view.chosen.y} kind="chosen" />}
      </Board>
      <div className="replay-caption">
        <span>{view === null ? "" : view.heat ? `As ${shooter} saw it` : `${shooter} weighs nothing here`}</span>
        <span className="num">
          {hits} hits in {state.shotsTaken} · {state.shipsSunk}/{fleet.length} sunk
        </span>
      </div>
    </div>
  );
}
