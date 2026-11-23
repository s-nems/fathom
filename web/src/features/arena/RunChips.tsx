import type { RunSummary } from "@/data/api/types";
import { KeptNote } from "@/ui/controls/KeptNote";
import { Pill } from "@/ui/controls/Pill";
import type { Preset } from "./setup/about";
import { presetMatching } from "./setup/about";
import { when } from "@/lib/format";
import { runName, STATUS_PILL } from "./arenaModel";

const CUSTOM = "Custom";

interface RunChipsProps {
  runs: RunSummary[];
  presets: Preset[];
  shownId: string | undefined;
  persistent: boolean;
  onShow: (id: string) => void;
  onClear: () => void;
}

/** Every run kept in this browser, newest first, to go back to an earlier one. */
export function RunChips({ runs, presets, shownId, persistent, onShow, onClear }: RunChipsProps) {
  const now = new Date();
  return (
    <div className="arena-runbar">
      {runs.map((run) => {
        const { label, tone } = STATUS_PILL[run.status];
        const preset = presetMatching(presets, run.shooters, run.layouts);
        return (
          <button
            key={run.id}
            type="button"
            className="arena-chip"
            aria-pressed={run.id === shownId}
            onClick={() => onShow(run.id)}
          >
            <b>
              {runName(run)}
              <Pill tone={tone}>{label}</Pill>
            </b>
            <span className="arena-chip-meta">
              {preset?.label ?? CUSTOM} · {run.games} games · {when(run.startedAt, now)}
            </span>
          </button>
        );
      })}
      <span className="arena-kept">
        <KeptNote persistent={persistent} question="Forget every run?" onClear={onClear} />
      </span>
    </div>
  );
}
