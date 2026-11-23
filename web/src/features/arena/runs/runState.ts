import type { Cell, Run, RunRequest, RunStatus, RunSummary } from "@/data/api/types";
import { descending } from "@/lib/order";

/** The steps a run goes through, each a new value. A run starts queued and ends done, cancelled or failed. */

/** A shooter and a layout source: one cell of the table of a run. */
export interface Pairing {
  shooter: string;
  layout: string;
}

export const isActive = (status: RunStatus): boolean => status === "QUEUED" || status === "RUNNING";

/** The cells of a run in the order they are measured: shooter by shooter, each against every layout source. */
export function pairingsOf(request: RunRequest): Pairing[] {
  return request.shooters.flatMap((shooter) => request.layouts.map((layout) => ({ shooter, layout })));
}

export function queued(id: string, request: RunRequest, startedAt: Date): Run {
  return {
    id,
    startedAt: startedAt.toISOString(),
    games: request.games,
    seed: request.seed,
    shooters: [...request.shooters],
    layouts: [...request.layouts],
    status: "QUEUED",
    cellsDone: 0,
    cellsTotal: request.shooters.length * request.layouts.length,
    cellGamesDone: 0,
    error: null,
    cells: [],
  };
}

export const running = (run: Run): Run => ({ ...run, status: "RUNNING" });

/** The run after `games` more games of the cell under way came back. */
export const withGames = (run: Run, games: number): Run => ({ ...run, cellGamesDone: run.cellGamesDone + games });

/** The run after the cell under way was measured. The next cell starts at no games. */
export const withCell = (run: Run, cell: Cell): Run => ({
  ...run,
  cells: [...run.cells, cell],
  cellsDone: run.cellsDone + 1,
  cellGamesDone: 0,
});

/** The run once it stopped. It keeps the cells it finished, and loses the games of a cell left half way. */
export const stopped = (
  run: Run,
  status: Exclude<RunStatus, "QUEUED" | "RUNNING">,
  error: string | null = null,
): Run => ({
  ...run,
  status,
  error,
  cellGamesDone: 0,
});

/** A run read from storage that is taken up again where it stopped: it waits its turn and keeps its cells. */
export const resumed = (run: Run): Run => ({ ...run, status: "QUEUED", cellGamesDone: 0 });

/** The cells of a run that are still to be measured, in order. */
export const pairingsLeft = (run: Run): Pairing[] => pairingsOf(run).slice(run.cells.length);

/** A run read from storage that nothing is running any more, as when the page was closed during it. */
export const interrupted = (run: Run): Run => (isActive(run.status) ? stopped(run, "CANCELLED") : run);

export function summaryOf(run: Run): RunSummary {
  const { cells: _cells, ...summary } = run;
  return summary;
}

/** Runs with the newest first. Ids are numbers counted up. */
export const newestFirst = <T extends RunSummary>(runs: T[]): T[] => descending(runs, (run) => Number(run.id));

/** Runs in the order they were started. */
export const oldestFirst = <T extends RunSummary>(runs: T[]): T[] => newestFirst(runs).reverse();

export const nextId = (runs: RunSummary[]): string =>
  String(runs.reduce((highest, run) => Math.max(highest, Number(run.id)), 0) + 1);
