import { useState } from "react";
import type { PlayState, Target } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { Board } from "@/ui/board/Board";
import { Button } from "@/ui/controls/Button";
import type { CellInteraction } from "@/ui/board/CellTargets";
import { FleetPips } from "@/ui/board/FleetPips";
import { MarksLayer } from "@/ui/board/MarksLayer";
import { Pill } from "@/ui/controls/Pill";
import { RingLayer } from "@/ui/board/RingLayer";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import { cellIndex, cellName } from "@/game/board";
import { sameShip } from "@/game/fleet";
import { RESULT_LABEL } from "@/game/shotText";
import { sideNames } from "@/game/players";
import { replayStateAt, type BoardState } from "@/game/replayState";
import { useCatalogue } from "@/data/api/catalogue";
import { ShotFeed } from "./ShotFeed";

interface BattleProps {
  play: PlayState;
  /** The cell the human shot at while the engine has not answered yet. */
  pending: Target | null;
  failure: string | null;
  /** Takes the line that says whose turn it is, which gets the focus when the battle begins. */
  landing: (element: HTMLElement | null) => void;
  onShoot: (x: number, y: number) => void;
  onGiveUp: () => void;
}

function WatersHead({ title, board, fleet }: { title: string; board: BoardState; fleet: number[] }) {
  return (
    <header className="panel-head">
      <h2>{title}</h2>
      <span className="dim small">
        {board.shipsSunk} of {fleet.length} sunk
      </span>
      <div className="panel-aside">
        <FleetPips fleet={fleet} sunk={board.sunk.map((ship) => ship.size)} />
      </div>
    </header>
  );
}

/** Leaving a game loses it, so the button asks once more before it does. */
function GiveUp({ onGiveUp }: { onGiveUp: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setAsking(true)}>
        Give up
      </Button>
    );
  }
  return (
    <>
      <Button size="sm" onClick={onGiveUp}>
        Leave the game
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>
        Stay
      </Button>
    </>
  );
}

/** The game under way: the enemy waters the human shoots at, the own waters, and the latest shots. */
export function Battle({ play, pending, failure, landing, onShoot, onGiveUp }: BattleProps) {
  const { fleet } = useCatalogue();
  const { game } = play;
  const { boards, latest } = replayStateAt(game, game.shots.length);
  const waiting = pending !== null || !play.yourTurn;
  const afloat = game.fleets.ONE.filter((ship) => !boards.ONE.sunk.some((sunk) => sameShip(sunk, ship)));
  const hitMe = latest !== null && latest.player === "TWO" ? latest : null;

  const interaction: CellInteraction = {
    describe: (x, y) => {
      const mark = boards.TWO.marks.get(cellIndex(x, y));
      return `${cellName(x, y)}, ${mark === undefined ? "not shot at" : RESULT_LABEL[mark]}`;
    },
    onActivate: onShoot,
    isDisabled: (x, y) => waiting || boards.TWO.marks.has(cellIndex(x, y)),
  };

  return (
    <>
      <div className="play-turn" role="status" ref={landing} tabIndex={-1}>
        {waiting ? <Pill>Bot's turn</Pill> : <Pill tone="live">Your turn</Pill>}
        {waiting ? "The bot is answering." : "Pick a cell in enemy waters."}
        <span className="play-turn-shot num">shot {game.shots.length + 1}</span>
      </div>
      {failure !== null && <Alert title="The shot was not played" detail={failure} />}
      <div className="play-battle">
        <section className="panel">
          <WatersHead title="Enemy waters" board={boards.TWO} fleet={fleet} />
          <div className="pad">
            <Board title="Enemy waters" interaction={interaction}>
              <ShipsLayer ships={boards.TWO.sunk} tone="sunk" />
              <MarksLayer marks={boards.TWO.marks} />
              {pending && <RingLayer x={pending.x} y={pending.y} kind="chosen" />}
            </Board>
          </div>
        </section>
        <div className="stack">
          <section className="panel">
            <WatersHead title="Your waters" board={boards.ONE} fleet={fleet} />
            <div className="pad">
              <Board title="Your waters, shot at by the bot">
                <ShipsLayer ships={afloat} />
                <ShipsLayer ships={boards.ONE.sunk} tone="sunk" />
                <MarksLayer marks={boards.ONE.marks} />
                {hitMe && <RingLayer x={hitMe.x} y={hitMe.y} kind="latest" />}
              </Board>
            </div>
          </section>
          <section className="panel">
            <header className="panel-head">
              <h2>Last shots</h2>
              <div className="panel-aside">
                <GiveUp onGiveUp={onGiveUp} />
              </div>
            </header>
            <div className="pad">
              <ShotFeed shots={game.shots} names={sideNames(game)} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
