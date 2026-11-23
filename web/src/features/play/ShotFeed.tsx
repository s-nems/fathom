import type { Player, ShotRecord } from "@/data/api/types";
import { cellName } from "@/game/board";
import { RESULT_CLASS, shotResultText } from "@/game/shotText";
import type { SideName } from "@/game/players";

/** How many of the latest shots the feed shows. */
const FEED_LENGTH = 5;

/** The latest shots of both sides, newest first. */
export function ShotFeed({ shots, names }: { shots: ShotRecord[]; names: Record<Player, SideName> }) {
  if (shots.length === 0) return <p className="dim small">No shot yet.</p>;
  const latest = shots.map((shot, index) => ({ shot, number: index + 1 })).slice(-FEED_LENGTH);
  return (
    <ol className="play-feed" aria-live="polite">
      {latest.reverse().map(({ shot, number }) => (
        <li key={number}>
          <span className="play-feed-number">{number}</span>
          <span>
            {names[shot.player].short} <b className="num">{cellName(shot.x, shot.y)}</b>{" "}
            <span className={RESULT_CLASS[shot.result]}>{shotResultText(shot, "long")}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
