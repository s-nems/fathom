import { api } from "@/data/api/client";
import type { RunSummary, StoredGameSummary } from "@/data/api/types";
import { KeptNote } from "@/ui/controls/KeptNote";
import { plural } from "@/lib/format";
import { hrefOf } from "@/app/route";
import { shownData, useLoad } from "@/lib/useAsync";
import { humanResult } from "./humanResult";

interface Kept {
  runs: RunSummary[];
  games: StoredGameSummary[];
  persistent: boolean;
}

const kept = async (): Promise<Kept> => {
  const [runs, games, persistent] = await Promise.all([api.runs(), api.games(), api.keepsHistory()]);
  return { runs, games, persistent };
};

/** The latest run and games of this browser, one click away. Nothing is shown on a first visit. */
export function ContinueRow() {
  const { state, reload } = useLoad(kept, []);
  const data = shownData(state);
  if (data === undefined) return null;

  /** The runs come newest first. */
  const run = data.runs.at(0);
  const botGame = data.games.find((game) => game.kind === "BOTS");
  const humanGame = data.games.find((game) => game.kind === "HUMAN");
  if (run === undefined && botGame === undefined && humanGame === undefined) return null;

  return (
    <div className="home-resume">
      <span className="label">Continue</span>
      {run && (
        <a href={hrefOf("arena", { run: run.id })}>
          <b>Latest run</b>
          <span className="num">
            {run.cellsDone} / {run.cellsTotal}
          </span>
        </a>
      )}
      {botGame && (
        <a href={hrefOf("replay", { game: botGame.id })}>
          <b>{botGame.title}</b>
          <span className="num">{plural(botGame.shots, "shot")}</span>
        </a>
      )}
      {humanGame && (
        <a href={hrefOf("play", { game: humanGame.id })}>
          <b>Your last game</b>
          <span className="num">{humanResult(humanGame)}</span>
        </a>
      )}
      <KeptNote
        persistent={data.persistent}
        question="Forget every run and game?"
        onClear={() => void api.clearHistory().then(reload, reload)}
      />
    </div>
  );
}
