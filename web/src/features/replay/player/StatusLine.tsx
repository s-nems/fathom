import type { GameRecord, Player, ShotRecord } from "@/data/api/types";
import { Pill } from "@/ui/controls/Pill";
import { PlayerDot } from "@/ui/board/PlayerDot";
import { cellName } from "@/game/board";
import { shotResultText } from "@/game/shotText";
import { isHumanGame, type SideName } from "@/game/players";

interface StatusLineProps {
  game: GameRecord;
  names: Record<Player, SideName>;
  position: number;
  latest: ShotRecord | null;
  /** While the replay runs by itself the line changes too often to be read out. */
  playing: boolean;
}

/** What just happened, in words: who fired where and what it did, and who won once the last shot is shown. */
export function StatusLine({ game, names, position, latest, playing }: StatusLineProps) {
  const live = playing ? "off" : undefined;
  if (latest === null) {
    const first = game.shots[0]?.player;
    return (
      <div className="replay-status" role="status" aria-live={live}>
        <span className="replay-status-shot">Start</span>
        {first !== undefined && (
          <>
            <PlayerDot player={first} />
            <span>{names[first].short} first</span>
          </>
        )}
      </div>
    );
  }
  const over = position === game.shots.length && game.result !== null;
  return (
    <div className="replay-status" role="status" aria-live={live}>
      <span className="replay-status-shot">Shot {position}</span>
      <PlayerDot player={latest.player} />
      <span>
        {names[latest.player].short} at <b>{cellName(latest.x, latest.y)}</b>
      </span>
      <Pill tone={latest.result === "MISS" ? "plain" : "hit"}>{shotResultText(latest)}</Pill>
      {over && game.result !== null && <Pill tone="live">{winText(game, names[game.result.winner].short)}</Pill>}
    </div>
  );
}

/** The human is player ONE and is spoken to, a bot is spoken of. */
const winText = (game: GameRecord, name: string): string =>
  isHumanGame(game) && game.result?.winner === "ONE" ? `${name} win` : `${name} wins`;
