import { useState } from "react";
import type { GameRecord, Player } from "@/data/api/types";
import { Segmented } from "@/ui/controls/Segmented";
import { opponentOf, PLAYERS, type SideName } from "@/game/players";
import type { ReplayState } from "@/game/replayState";
import type { ShooterView } from "@/game/shooterView";
import { GameBoard } from "./GameBoard";

interface ReplayBoardsProps {
  game: GameRecord;
  names: Record<Player, SideName>;
  state: ReplayState;
  /** The views of both shooters, or null to show the fleets. */
  views: Record<Player, ShooterView> | null;
  /** The sizes of the ships of a fleet. */
  fleet: number[];
}

/** Both boards side by side. On a phone one at a time, with a switch between them. */
export function ReplayBoards({ game, names, state, views, fleet }: ReplayBoardsProps) {
  const [shown, setShown] = useState<Player>("ONE");
  return (
    <>
      <Segmented
        className="replay-board-switch"
        label="Board on screen"
        value={shown}
        options={PLAYERS.map((player) => ({ value: player, label: names[player].fleet }))}
        onChange={setShown}
      />
      <div className="replay-boards" data-shown={shown}>
        {PLAYERS.map((owner) => (
          <GameBoard
            key={owner}
            owner={owner}
            name={names[owner]}
            shooter={names[opponentOf(owner)].short}
            ships={game.fleets[owner]}
            state={state.boards[owner]}
            view={views?.[owner] ?? null}
            fleet={fleet}
            latest={state.latest !== null && state.latest.player !== owner ? state.latest : null}
          />
        ))}
      </div>
    </>
  );
}
