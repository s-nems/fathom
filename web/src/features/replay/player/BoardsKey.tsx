import { HeatRamp, KeyMark, KeyRing, KeyShip } from "@/ui/board/BoardKey";
import type { ReplayMode } from "./Replay";

/** What the marks on the boards of a replay mean, for the mode on screen. */
export function BoardsKey({ mode }: { mode: ReplayMode }) {
  if (mode === "belief") {
    return (
      <div className="key replay-boards-key">
        <HeatRamp low="unlikely" high="likely a ship" />
        <span>
          <KeyRing kind="chosen" />
          next shot
        </span>
      </div>
    );
  }
  return (
    <div className="key replay-boards-key">
      <span>
        <KeyShip tone="afloat" />
        ship
      </span>
      <span>
        <KeyShip tone="sunk" />
        sunk
      </span>
      <span>
        <KeyMark hit />
        hit
      </span>
      <span>
        <KeyMark hit={false} />
        miss
      </span>
      <span>
        <KeyRing kind="latest" />
        last shot
      </span>
    </div>
  );
}
