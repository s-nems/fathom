import type { Run } from "@/data/api/types";
import { isActive } from "./runs/runState";
import { Button } from "@/ui/controls/Button";
import { Pill } from "@/ui/controls/Pill";
import { arenaTable, type Verdict } from "./results/arenaTable";
import { decimal } from "@/lib/format";
import type { CellKey } from "./results/winShare";
import { runName, runProgress, STATUS_PILL } from "./arenaModel";
import { RunMatrix } from "./RunMatrix";
import { PERCENT } from "@/lib/number";

function VerdictLine({ run, verdict }: { run: Run; verdict: Verdict | null }) {
  if (verdict === null) return <p className="arena-verdict">No layout source is finished yet.</p>;
  return (
    <p className="arena-verdict">
      {run.status === "DONE" ? "" : "So far "}
      <b>{verdict.best}</b> needs the fewest shots: {decimal(verdict.average)} on average
      {verdict.second !== null && (
        <>
          , {decimal(verdict.second.behind)} fewer than <b>{verdict.second.shooter}</b>
        </>
      )}
      .
    </p>
  );
}

interface RunPanelProps {
  run: Run;
  selected: CellKey | null;
  onSelect: (key: CellKey) => void;
  onCancel: () => void;
  onAgain: () => void;
}

/** One run: where it stands, what it says in a sentence, and the table of mean shots behind that. */
export function RunPanel({ run, selected, onSelect, onCancel, onAgain }: RunPanelProps) {
  const table = arenaTable(run);
  const live = isActive(run.status);
  const { label, tone } = STATUS_PILL[run.status];
  const progress = runProgress(run);

  return (
    <section className="panel arena-run">
      <header className="panel-head">
        <h2>{runName(run)}</h2>
        <Pill tone={tone}>{label}</Pill>
        <span className="num dim">
          {run.cellsDone} of {run.cellsTotal} pairings · {run.games} games each
        </span>
        <div className="panel-aside">
          <Button size="sm" variant="ghost" onClick={live ? onCancel : onAgain}>
            {live ? "Cancel" : "Run again"}
          </Button>
        </div>
      </header>
      {live ? (
        <div
          className="arena-progress"
          role="progressbar"
          aria-label="Pairings measured"
          aria-valuemin={0}
          aria-valuemax={PERCENT}
          aria-valuenow={Math.round(progress * PERCENT)}
        >
          <i style={{ width: `${progress * PERCENT}%` }} />
        </div>
      ) : (
        <div className="arena-progress" />
      )}
      <VerdictLine run={run} verdict={table.verdict} />
      <RunMatrix table={table} games={run.games} selected={selected} onSelect={onSelect} />
      <div className="panel-foot">
        <span>fewer shots</span>
        <span className="ramp arena-ramp" />
        <span>more</span>
        <span>Mean shots to sink a fleet</span>
        <span className="end">Underlined: best in column</span>
      </div>
    </section>
  );
}
