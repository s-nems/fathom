import { Select } from "@/ui/controls/Field";
import { PauseIcon, PlayIcon, StepIcon } from "@/ui/controls/icons";
import { SPEEDS, type Playback } from "./usePlayback";

const SPEED_OPTIONS = SPEEDS.map((speed) => ({ value: speed, label: `${speed}×` }));

/** The controls of a replay: the timeline to drag, one shot back or forward, play, and how fast. */
export function Transport({ playback }: { playback: Playback }) {
  const { position, total, playing } = playback;
  return (
    <>
      <input
        className="replay-scrubber"
        type="range"
        min={0}
        max={total}
        value={position}
        aria-label="Shot"
        onChange={(event) => playback.seek(event.target.valueAsNumber)}
      />
      <div className="replay-controls">
        <button
          type="button"
          className="icon-btn"
          aria-label="Back one shot"
          disabled={position === 0}
          onClick={() => playback.step(-1)}
        >
          <StepIcon back />
        </button>
        <button
          type="button"
          className="round-btn"
          aria-label={playing ? "Pause" : "Play"}
          disabled={total === 0}
          onClick={playback.togglePlaying}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Forward one shot"
          disabled={position === total}
          onClick={() => playback.step(1)}
        >
          <StepIcon />
        </button>
        <span className="num replay-controls-position">
          {position} / {total}
        </span>
        <span className="replay-controls-end">
          <Select
            label="Speed"
            labelHidden
            className="field replay-speed"
            value={playback.speed}
            options={SPEED_OPTIONS}
            onChange={playback.setSpeed}
          />
          <span className="kbd-hint">
            <span className="kbd">←</span> <span className="kbd">→</span> <span className="kbd">space</span>
          </span>
        </span>
      </div>
    </>
  );
}
