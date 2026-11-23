import type { Cell, Run } from "@/data/api/types";
import { pairingsOf } from "../runs/runState";
import { onScale, robustScale } from "@/lib/scale";
import { findCell } from "./winShare";

/** One place of the table of a run: a measured pairing, or why there is no number yet. */
export type Slot =
  | {
      kind: "done";
      cell: Cell;
      /** 1 for the best of its column, 0 for the worst that is no outlier. */ good: number;
      best: boolean;
    }
  | { kind: "running"; gamesDone: number }
  | { kind: "queued" }
  | { kind: "skipped" };

export interface TableRow {
  shooter: string;
  slots: Slot[];
  /** Mean over the layout sources every shooter was measured on, null while there is none. */
  average: number | null;
  /** How far the average lies behind the best one. */
  behind: number | null;
}

/** What a run says in one sentence. */
export interface Verdict {
  best: string;
  average: number;
  /** The runner-up and its distance, null when only one shooter ran. */
  second: { shooter: string; behind: number } | null;
}

/** The table of a run as it is shown: rows by average, best first, once there is an average. */
export interface ArenaTable {
  layouts: string[];
  rows: TableRow[];
  verdict: Verdict | null;
}

const BEST = 1;

function slotOf(run: Run, shooter: string, layout: string, column: Cell[], runningAt: number): Slot {
  const cell = findCell(run.cells, { shooter, layout });
  if (cell !== undefined) {
    const means = column.map((other) => other.mean);
    const lowest = Math.min(...means);
    const good = means.length > 1 ? BEST - onScale(cell.mean, robustScale(means)) : BEST;
    return { kind: "done", cell, good, best: cell.mean === lowest };
  }
  const at = pairingsOf(run).findIndex((pairing) => pairing.shooter === shooter && pairing.layout === layout);
  if (run.status === "RUNNING" && at === runningAt) return { kind: "running", gamesDone: run.cellGamesDone };
  return run.status === "RUNNING" || run.status === "QUEUED" ? { kind: "queued" } : { kind: "skipped" };
}

const mean = (values: number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;

export function arenaTable(run: Run): ArenaTable {
  const columns = run.layouts.map((layout) => run.cells.filter((cell) => cell.layout === layout));
  const complete = run.layouts.filter((_, index) => columns[index].length === run.shooters.length);
  const averages = run.shooters.map((shooter) =>
    complete.length === 0
      ? null
      : mean(complete.map((layout) => findCell(run.cells, { shooter, layout })?.mean ?? Number.NaN)),
  );
  const known = averages.filter((average): average is number => average !== null);
  const lowest = known.length > 0 ? Math.min(...known) : null;

  const rows = run.shooters.map((shooter, index): TableRow => {
    const average = averages[index];
    return {
      shooter,
      slots: run.layouts.map((layout, column) => slotOf(run, shooter, layout, columns[column], run.cells.length)),
      average,
      behind: average === null || lowest === null ? null : average - lowest,
    };
  });
  const ranked = lowest === null ? rows : [...rows].sort((one, other) => (one.average ?? 0) - (other.average ?? 0));
  return { layouts: run.layouts, rows: ranked, verdict: verdictOf(ranked) };
}

function verdictOf(ranked: TableRow[]): Verdict | null {
  const [first, second] = ranked;
  if (first === undefined || first.average === null) return null;
  return {
    best: first.shooter,
    average: first.average,
    second: second === undefined || second.behind === null ? null : { shooter: second.shooter, behind: second.behind },
  };
}
