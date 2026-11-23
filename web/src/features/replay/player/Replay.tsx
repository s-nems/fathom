import { useMemo, useState } from "react";
import type { GameRecord } from "@/data/api/types";
import { Panel } from "@/ui/controls/Panel";
import { Segmented } from "@/ui/controls/Segmented";
import { courseOf } from "./afloat";
import { sideNames } from "@/game/players";
import { replayStateAt } from "@/game/replayState";
import { hasWeights, shooterViews } from "@/game/shooterView";
import { useCatalogue } from "@/data/api/catalogue";
import { SPACE, useKeys } from "@/lib/useKeys";
import { AfloatChart } from "./AfloatChart";
import { BoardsKey } from "./BoardsKey";
import { ReplayBoards } from "./ReplayBoards";
import { ShotList } from "./ShotList";
import { StatusLine } from "./StatusLine";
import { Transport } from "./Transport";
import { usePlayback } from "./usePlayback";

/** What the boards of a replay show: the fleets, or what each shooter thought of the board it fires at. */
export type ReplayMode = "fleets" | "belief";

const MODES = [
  { value: "fleets", label: "Fleets" },
  { value: "belief", label: "Shooter's view" },
] as const;

const NO_VIEW_OF_A_LOG = "A log does not say what the shooter weighed, so there is no shooter's view.";
const NO_VIEW = "Neither shooter of this game weighs the cells, so there is no shooter's view.";

interface ReplayProps {
  game: GameRecord;
  /** Open on the last shot, as after a game just played. */
  fromEnd?: boolean;
}

/** A game shot by shot: both boards, how it went, the timeline and the list of shots. */
export function Replay({ game, fromEnd = false }: ReplayProps) {
  const catalogue = useCatalogue();
  const playback = usePlayback(game.shots.length, fromEnd ? game.shots.length : 0);
  const [wanted, setWanted] = useState<ReplayMode>("fleets");
  const weighed = hasWeights(game);
  const mode = weighed ? wanted : "fleets";
  const fleetCells = catalogue.fleet.reduce((sum, size) => sum + size, 0);
  const course = useMemo(() => courseOf(game, fleetCells), [game, fleetCells]);
  const names = sideNames(game);
  const state = replayStateAt(game, playback.position);
  const fromLog = game.shots.some((shot) => shot.at !== null);

  useKeys({
    ArrowLeft: () => playback.step(-1),
    ArrowRight: () => playback.step(1),
    [SPACE]: playback.togglePlaying,
  });

  return (
    <div className="replay">
      <section className="panel">
        <header className="panel-head">
          <StatusLine
            game={game}
            names={names}
            position={playback.position}
            latest={state.latest}
            playing={playback.playing}
          />
          <div className="panel-aside">
            <Segmented
              label="What the boards show"
              value={mode}
              options={MODES.map((option) => ({ ...option, disabled: option.value === "belief" && !weighed }))}
              onChange={setWanted}
            />
          </div>
        </header>
        <ReplayBoards
          game={game}
          names={names}
          state={state}
          views={mode === "belief" ? shooterViews(game, playback.position, state) : null}
          fleet={catalogue.fleet}
        />
        <BoardsKey mode={mode} />
        {!weighed && <p className="replay-note">{fromLog ? NO_VIEW_OF_A_LOG : NO_VIEW}</p>}
        <div className="replay-transport">
          <AfloatChart course={course} fleetCells={fleetCells} names={names} position={playback.position} />
          <Transport playback={playback} />
        </div>
      </section>
      <Panel className="replay-shot-panel" title="Shots" aside={<span className="num dim">{game.shots.length}</span>}>
        <ShotList shots={game.shots} position={playback.position} onSeek={playback.seek} />
      </Panel>
    </div>
  );
}
