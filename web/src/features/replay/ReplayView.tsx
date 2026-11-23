import { useEffect, type ReactNode } from "react";
import { api } from "@/data/api/client";
import type { GameRecord, Player, StoredGame } from "@/data/api/types";
import { Alert } from "@/ui/controls/Alert";
import { Button } from "@/ui/controls/Button";
import { Pill } from "@/ui/controls/Pill";
import { PlayerDot } from "@/ui/board/PlayerDot";
import { Waiting } from "@/ui/controls/Waiting";
import { when } from "@/lib/format";
import { PLAYERS, sideNames } from "@/game/players";
import { useCatalogue } from "@/data/api/catalogue";
import { formatHash, hrefOf, type RouteParams } from "@/app/route";
import { shownData, useAsync, useLoad } from "@/lib/useAsync";
import type { Navigation } from "@/app/useRoute";
import { Replay } from "./player/Replay";
import { asksToWatch, requestOf, setupFrom, setupParams, type GameSetup } from "./gameSetup";
import { LogButton } from "./LogPicker";
import { ReplayStart } from "./ReplayStart";
import { useFileDrag } from "./useFileDrag";
import { useOpenedLog } from "./useOpenedLog";

/** A game on screen with the line that says what it is. */
interface Shown {
  game: GameRecord;
  summary: ReactNode;
}

function Versus({ sides, note }: { sides: readonly [string, string]; note: string }) {
  return (
    <>
      {PLAYERS.map((player, index) => (
        <span key={player} className="inline">
          {index > 0 && <span className="replay-versus">vs</span>}
          <PlayerDot player={player} />
          {sides[index]}
        </span>
      ))}
      <span className="dim">{note}</span>
    </>
  );
}

const sideOf = (contestant: GameSetup["one"]): string => `${contestant.layout} / ${contestant.shooter}`;

/**
 * The game the hash names: one kept in this browser, or the one its setup gives. Null when it names none.
 * The game of a setup is only looked at, so that a reload or a link followed twice keeps nothing.
 */
function gameTask(params: RouteParams, setup: GameSetup): (() => Promise<Shown>) | null {
  const { game: id } = params;
  if (id !== undefined) {
    return async () => {
      const stored = await api.game(id);
      const names = sideNames(stored.game);
      const side = (player: Player) => names[player].detail || names[player].short;
      return {
        game: stored.game,
        summary: <Versus sides={[side("ONE"), side("TWO")]} note={when(stored.playedAt, new Date())} />,
      };
    };
  }
  if (!asksToWatch(params)) return null;
  return async () => ({
    game: await api.watchGame(requestOf(setup)),
    summary: <Versus sides={[sideOf(setup.one), sideOf(setup.two)]} note={`seed ${setup.seed}`} />,
  });
}

/** Plays a game between two bots or opens a log, and replays it shot by shot. */
export function ReplayView({ route, navigate }: Navigation) {
  const catalogue = useCatalogue();
  const { params } = route;
  const hash = formatHash(route);
  const setup = setupFrom(params, catalogue);
  const asked = useLoad(gameTask(params, setup), [hash]);
  const played = useAsync<StoredGame>();
  const opened = useOpenedLog(hash);
  const dragging = useFileDrag(opened.open);
  const forgetPlayed = played.reset;

  // A game played from the form belongs to the address it was played at.
  useEffect(() => forgetPlayed, [hash, forgetPlayed]);

  /** Plays the game of the form and keeps it, once. The address then names the kept game, not its setup. */
  const play = (chosen: GameSetup) => {
    opened.close();
    played.run(() => api.playGame(requestOf(chosen)), {
      onDone: (stored) => window.location.replace(hrefOf("replay", { game: stored.id })),
    });
  };

  const { log } = opened;
  const shown: Shown | undefined =
    log !== null
      ? {
          game: log.game,
          summary: (
            <>
              <Pill>Log</Pill>
              {log.name}
            </>
          ),
        }
      : shownData(asked.state);
  const playing = played.state.status === "loading" || played.state.status === "ready";
  const loading = asked.state.status === "loading" || playing;
  const failure = played.state.status === "error" ? played.state : asked.state.status === "error" ? asked.state : null;
  const badFile = opened.bad && (
    <Alert title={<span className="num">{opened.bad.name}</span>} detail={opened.bad.message}>
      is not a game log.
    </Alert>
  );
  const veil = dragging && (
    <div className="replay-veil">
      <div className="replay-veil-frame">
        Drop the log to open it<small>It stays on your device.</small>
      </div>
    </div>
  );

  if (shown !== undefined) {
    return (
      <section className="replay-view">
        <div className="head">
          <h1>Replay</h1>
          <div className="replay-summary">{shown.summary}</div>
          <div className="head-actions">
            <Button onClick={() => navigate("replay", params.game === undefined ? setupParams(setup) : {})}>
              New game
            </Button>
            <LogButton onFile={opened.open}>Open a log</LogButton>
          </div>
        </div>
        {badFile}
        <Replay key={log ? `log ${log.serial}` : hash} game={shown.game} />
        {veil}
      </section>
    );
  }

  return (
    <section className="replay-view replay-empty">
      <div className="head">
        <h1>Replay</h1>
      </div>
      <ReplayStart
        key={hash}
        initial={setup}
        busy={loading}
        formNote={
          <>
            {loading && <Waiting>Playing the game</Waiting>}
            {failure !== null && (
              <Alert
                title={
                  params.game === undefined || failure === played.state
                    ? "The game could not be played"
                    : "This game is not kept any more"
                }
                detail={failure.message}
              />
            )}
          </>
        }
        logNote={badFile}
        onPlay={play}
        onLog={opened.open}
      />
      {veil}
    </section>
  );
}
