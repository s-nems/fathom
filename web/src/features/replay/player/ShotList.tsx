import { useEffect, useRef } from "react";
import type { ShotRecord } from "@/data/api/types";
import { PlayerDot } from "@/ui/board/PlayerDot";
import { cellName } from "@/game/board";
import { RESULT_CLASS, shotResultText } from "@/game/shotText";
import { decimal } from "@/lib/format";

interface ShotListProps {
  shots: ShotRecord[];
  /** Shots shown so far. The last of them is the current one. */
  position: number;
  onSeek: (position: number) => void;
}

/** A game takes its time from the shooter, a log from its clock. */
const timeOf = (shot: ShotRecord): string => (shot.millis !== null ? `${decimal(shot.millis)} ms` : (shot.at ?? ""));

const rowClass = (index: number, position: number): string | undefined =>
  index === position - 1 ? "replay-now" : index >= position ? "replay-later" : undefined;

/** Every shot of a game in order. It follows the replay, and a click on a shot goes there. */
export function ShotList({ shots, position, onSeek }: ShotListProps) {
  const box = useRef<HTMLDivElement>(null);
  const current = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (box.current === null) return;
    const row = current.current;
    box.current.scrollTop = row === null ? 0 : row.offsetTop - box.current.clientHeight / 2;
  }, [position]);

  return (
    <div className="replay-shot-list" ref={box}>
      <ol>
        {shots.map((shot, index) => (
          <li key={index} ref={index === position - 1 ? current : undefined} className={rowClass(index, position)}>
            <button
              type="button"
              aria-current={index === position - 1 ? "step" : undefined}
              onClick={() => onSeek(index + 1)}
            >
              <span className="replay-shot-number">{index + 1}</span>
              <PlayerDot player={shot.player} />
              <b>{cellName(shot.x, shot.y)}</b>
              <span className={RESULT_CLASS[shot.result]}>{shotResultText(shot)}</span>
              <span className="replay-shot-time">{timeOf(shot)}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
