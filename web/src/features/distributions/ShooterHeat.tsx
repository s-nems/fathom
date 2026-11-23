import { useEffect, useState } from "react";
import { api } from "@/data/api/client";
import type { ShooterHeat as ShooterHeatAnswer } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { Board } from "@/ui/board/Board";
import { NumberInput, Select } from "@/ui/controls/Field";
import { HeatLayer } from "@/ui/board/HeatLayer";
import { Panel } from "@/ui/controls/Panel";
import { Waiting } from "@/ui/controls/Waiting";
import { grouped } from "@/lib/format";
import { longestGame } from "./heat";
import { DEFAULT_SEED, MAX_SEED, MIN_SEED } from "@/game/seed";
import { pick, PLAIN_LAYOUT, useCatalogue } from "@/data/api/catalogue";
import { reached, shooterMap, withinGame } from "./heatMaps";
import { GAMES, within } from "./limits";
import { MiniHeat } from "./MiniHeat";
import { useComputed } from "./useComputed";

const SHOTS_AT_START = 20;
const FIRST_SHOT = 1;
/** Shot counts worth a look of their own: the opening, the hunt well under way, and the middle of a game. */
const MILESTONES: readonly number[] = [5, 15, 30, 50];

/** Where a shooter aims: the share of games that fired at every cell within their first shots. */
export function ShooterHeat({ onBusy }: { onBusy: (busy: boolean) => void }) {
  const { shooters, layouts } = useCatalogue();
  const [shooter, setShooter] = useState(() => pick(shooters));
  const [layout, setLayout] = useState(() => pick(layouts, PLAIN_LAYOUT));
  const [games, setGames] = useState(GAMES.initial);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [shots, setShots] = useState(SHOTS_AT_START);

  const count = within(games, GAMES);
  const { data, busy, error } = useComputed(JSON.stringify([shooter, layout, count, seed]), (signal) =>
    api.shooterHeat({ shooter, layout, games: count, seed }, signal),
  );
  useEffect(() => onBusy(busy), [busy, onBusy]);

  return (
    <>
      <div className="dist-toolbar">
        <Select label="Shooter" value={shooter} options={shooters} onChange={setShooter} />
        <Select label="Fleets placed by" value={layout} options={layouts} onChange={setLayout} />
        <NumberInput label="Games" value={games} min={GAMES.min} max={GAMES.max} onChange={setGames} />
        <NumberInput label="Seed" value={seed} min={MIN_SEED} max={MAX_SEED} onChange={setSeed} />
      </div>
      {error !== null && (
        <Alert title="The map could not be computed." detail={error}>
          Change an option to try again.
        </Alert>
      )}
      {data === undefined ? (
        error === null && <Waiting>Shooting {grouped(count)} games</Waiting>
      ) : (
        <ShooterMaps heat={data} shots={shots} busy={busy} onShots={setShots} />
      )}
    </>
  );
}

interface ShooterMapsProps {
  heat: ShooterHeatAnswer;
  shots: number;
  busy: boolean;
  onShots: (shots: number) => void;
}

function ShooterMaps({ heat, shots, busy, onShots }: ShooterMapsProps) {
  const longest = longestGame(heat.turns);
  const shown = withinGame(shots, longest);
  const map = shooterMap(heat.turns, shown, heat.games);
  return (
    <div className={busy ? "dist busy" : "dist"} aria-busy={busy}>
      <Panel
        title={
          <>
            First <span className="num">{shown}</span> shots
          </>
        }
        aside={<span className="dim small">% of games that fired at the cell</span>}
      >
        <div className="pad dist-map">
          <Board
            title={`Share of ${grouped(heat.games)} games of ${heat.shooter} that fired at each cell in the first ${shown} shots`}
            ground={<HeatLayer values={map.values} printed={map.printed} />}
          />
        </div>
        <div className="dist-slider">
          <input
            type="range"
            min={FIRST_SHOT}
            max={longest}
            value={shown}
            aria-label="Shots so far"
            onChange={(event) => onShots(event.target.valueAsNumber)}
          />
          <span className="num">
            {shown} of {longest}
          </span>
        </div>
      </Panel>
      <Panel title="Jump to" className="dist-jump">
        <div className="pad dist-multiples">
          {reached(MILESTONES, longest).map((milestone) => (
            <button
              key={milestone}
              type="button"
              aria-pressed={milestone === shown}
              aria-label={`Jump to ${milestone} shots`}
              onClick={() => onShots(milestone)}
            >
              <MiniHeat map={shooterMap(heat.turns, milestone, heat.games)} caption={`${milestone} shots`} />
            </button>
          ))}
        </div>
      </Panel>
    </div>
  );
}
