import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/data/api/client";
import type { Contestant, GameRecord, PlayState, Ship, Target } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { Button } from "@/ui/controls/Button";
import { Waiting } from "@/ui/controls/Waiting";
import { toPlayer, type FirstShooter } from "@/game/firstShooter";
import { randomSeed } from "@/game/seed";
import { defaultContestant, useCatalogue } from "@/data/api/catalogue";
import { hrefOf } from "@/app/route";
import { useAsync, useLoad } from "@/lib/useAsync";
import { useRoute } from "@/app/useRoute";
import { Replay } from "@/features/replay/player/Replay";
import { Battle } from "./Battle";
import { OpponentChoice } from "./OpponentChoice";
import { Placement } from "./Placement";
import { Result } from "./result/Result";
import { savedPlay } from "./savedPlay";
import { Steps, type Stage } from "./Steps";

/** The parameter of the hash that names a finished game of the history to look back at. */
const GAME_PARAM = "game";

/** What is on screen once the game to look back at is there, as opposed to the review still waiting for it. */
const REVIEW_READY = "review-ready";

const stageOf = (play: PlayState | null, reviewing: boolean): Stage =>
  reviewing || play?.over ? "review" : play === null ? "place" : "battle";

/**
 * A game of the human against a bot: place the fleet, shoot it out, then look back at the game. The game
 * under way is kept for the tab, and a finished one has an address of its own, so neither is lost to a reload.
 */
export function PlayView() {
  const catalogue = useCatalogue();
  const { route, navigate } = useRoute();
  const gameId = route.params[GAME_PARAM];
  const [fleet, setFleet] = useState<Ship[]>([]);
  const [opponent, setOpponent] = useState<Contestant>(() => defaultContestant(catalogue));
  const [first, setFirst] = useState<FirstShooter>("random");
  const [play, setPlay] = useState<PlayState | null>(() => savedPlay.read());
  const [pending, setPending] = useState<Target | null>(null);
  const engine = useAsync<PlayState>();

  // The game just played is on hand. Any other game of the history is read from it.
  const justPlayed = play !== null && play.over && (gameId === undefined || play.storedId === gameId);
  const stored = useLoad(gameId === undefined || justPlayed ? null : async () => (await api.game(gameId)).game, [
    gameId,
    justPlayed,
  ]);
  const reviewed: GameRecord | undefined =
    play !== null && justPlayed ? play.game : stored.state.status === "ready" ? stored.state.data : undefined;

  const stage = stageOf(play, gameId !== undefined);
  const busy = engine.state.status === "loading";
  const failure = engine.state.status === "error" ? engine.state.message : null;

  const answered = (state: PlayState) => {
    setPending(null);
    setPlay(state);
    if (!state.over) return savedPlay.write(state);
    savedPlay.clear();
    // Replaced, not pushed: going back from the review should not land on the board of a game that is over.
    if (state.storedId !== undefined) window.location.replace(hrefOf("play", { [GAME_PARAM]: state.storedId }));
  };

  const start = () =>
    engine.run(() => api.startPlay({ fleet, opponent, seed: randomSeed(), firstShooter: toPlayer(first) }), {
      onDone: answered,
    });

  const shoot = (x: number, y: number) => {
    if (play === null || busy) return;
    setPending({ x, y });
    engine.run(() => api.shoot(play, x, y), { onDone: answered });
  };

  const giveUp = () => {
    engine.reset();
    setPending(null);
    setPlay(null);
    savedPlay.clear();
  };

  /** Forgets the game that is over, with its fleet: the next game starts from an empty board. */
  const forgetFinished = useCallback(() => {
    setPlay((current) => (current?.over ? null : current));
    setFleet([]);
  }, []);

  // With an address to leave, leaving it does the forgetting, see below.
  const again = () => (gameId === undefined ? forgetFinished() : navigate("play"));

  // Leaving the address of the game just played, by the top bar or by going back, ends its review too.
  const shownId = useRef(gameId);
  useEffect(() => {
    const left = shownId.current !== undefined && gameId === undefined;
    shownId.current = gameId;
    if (left) forgetFinished();
  }, [gameId, forgetFinished]);

  // A stage that replaces another takes the focus with it, or the keyboard would be left on nothing.
  const landing = useRef<HTMLElement | null>(null);
  const land = useCallback((element: HTMLElement | null) => {
    landing.current = element;
  }, []);
  const shown = reviewed === undefined ? stage : REVIEW_READY;
  const landedOn = useRef(shown);
  useEffect(() => {
    if (landedOn.current !== shown) landing.current?.focus();
    landedOn.current = shown;
  }, [shown]);

  return (
    <div className="play" data-stage={stage}>
      <div className="head">
        <div className="head-lead">
          <h1 ref={stage === "place" ? land : undefined} tabIndex={-1}>
            Play
          </h1>
          <Steps current={stage} />
        </div>
      </div>
      {stage === "review" ? (
        reviewed !== undefined ? (
          <>
            <Result game={reviewed} fleetSize={catalogue.fleet.length} landing={land} onAgain={again} />
            <Replay game={reviewed} fromEnd />
          </>
        ) : stored.state.status === "error" ? (
          <Alert
            title="This game is not in the history of this browser."
            detail={stored.state.message}
            action={<Button onClick={again}>Play a game</Button>}
          />
        ) : (
          <Waiting>Opening the game</Waiting>
        )
      ) : play === null ? (
        <Placement fleet={fleet} onFleet={setFleet} starting={busy} failure={failure} onStart={start}>
          <OpponentChoice opponent={opponent} first={first} onOpponent={setOpponent} onFirst={setFirst} />
        </Placement>
      ) : (
        <Battle
          play={play}
          pending={busy ? pending : null}
          failure={failure}
          landing={land}
          onShoot={shoot}
          onGiveUp={giveUp}
        />
      )}
    </div>
  );
}
