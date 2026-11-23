import { useEffect, useMemo, useState } from "react";
import { api } from "@/data/api/client";
import type { Catalogue, GameRecord, Player } from "@/data/api/types";
import { Board } from "@/ui/board/Board";
import { HeatLayer } from "@/ui/board/HeatLayer";
import { MarksLayer } from "@/ui/board/MarksLayer";
import { Pill } from "@/ui/controls/Pill";
import { RingLayer } from "@/ui/board/RingLayer";
import { ShipsLayer } from "@/ui/board/ShipsLayer";
import { opponentOf } from "@/game/players";
import { replayStateAt } from "@/game/replayState";
import { randomSeed } from "@/game/seed";
import { shooterViews } from "@/game/shooterView";
import { defaultContestant } from "@/data/api/catalogue";
import { shownData, useLoad } from "@/lib/useAsync";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { PauseIcon, PlayIcon } from "@/ui/controls/icons";

/** The player whose hunt is shown. Its shots land on the board of the other one. */
const HUNTER: Player = "ONE";
const HUNTED = opponentOf(HUNTER);
const STEP_MILLIS = 1100;
/** Shots already on the board when the page opens, so that it never opens on empty water. */
const OPENING_SHOTS = 14;
const TITLE = "A bot hunting a fleet";

/** A game of the default bot against itself. It is only looked at, so it is not kept. */
function huntToWatch(catalogue: Catalogue): Promise<GameRecord> {
  const bot = defaultContestant(catalogue);
  return api.watchGame({ one: bot, two: bot, seed: randomSeed(), firstShooter: HUNTER });
}

/**
 * The board of the home page: a real game of the bot, one shooter's hunt replayed slowly as it saw it.
 * It waits for the catalogue the app loads, and runs until the visitor pauses it.
 */
export function HeroBoard({ catalogue }: { catalogue: Catalogue | undefined }) {
  const game = shownData(useLoad(catalogue === undefined ? null : () => huntToWatch(catalogue), [catalogue]).state);
  const reducedMotion = useReducedMotion();
  /** What the visitor chose with the button. Until then the system says whether the hunt runs. */
  const [chosen, setChosen] = useState<boolean | null>(null);
  const running = chosen ?? !reducedMotion;
  const still = !running;
  /** The game with the shots of the hunter only, so that a position counts its shots. */
  const hunt = useMemo(
    () => (game === undefined ? null : { ...game, shots: game.shots.filter((shot) => shot.player === HUNTER) }),
    [game],
  );
  const total = hunt?.shots.length ?? 0;
  const [fired, setFired] = useState(OPENING_SHOTS);

  useEffect(() => {
    if (still || total === 0) return;
    const timer = window.setInterval(() => setFired((shots) => (shots >= total ? 1 : shots + 1)), STEP_MILLIS);
    return () => window.clearInterval(timer);
  }, [still, total]);

  if (hunt === null) {
    return (
      <figure className="home-hero">
        <Board title={TITLE} />
        <figcaption />
      </figure>
    );
  }

  const position = Math.min(fired, total);
  const state = replayStateAt(hunt, position);
  const board = state.boards[HUNTED];
  const view = shooterViews(hunt, position, state)[HUNTED];
  return (
    <figure className="home-hero">
      <Board title={TITLE} ground={view.heat ? <HeatLayer values={view.heat} /> : undefined}>
        <ShipsLayer ships={board.sunk} tone="sunk" />
        <MarksLayer marks={board.marks} />
        {state.latest && <RingLayer x={state.latest.x} y={state.latest.y} kind="latest" />}
        {view.chosen && <RingLayer x={view.chosen.x} y={view.chosen.y} kind="chosen" />}
      </Board>
      <figcaption>
        <button
          type="button"
          className="icon-btn home-hero-toggle"
          aria-label={running ? "Pause the hunt" : "Play the hunt"}
          onClick={() => setChosen(!running)}
        >
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
        {running && <Pill tone="live">Live</Pill>}
        <span>The bot hunting a fleet, shot {position}</span>
      </figcaption>
    </figure>
  );
}
