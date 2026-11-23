import type { Cell, RunStatus, RunSummary } from "@/data/api/types";
import type { PillTone } from "@/ui/controls/Pill";
import { clamp, PERCENT } from "@/lib/number";
import { GAME_SIZES } from "./setup/runSize";
import { DEFAULT_SEED } from "@/game/seed";
import type { CellKey } from "./results/winShare";

/** What a new run is set up with. */
export interface RunPick {
  shooters: string[];
  layouts: string[];
  games: number;
  seed: number;
}

export const STATUS_PILL: Record<RunStatus, { label: string; tone: PillTone }> = {
  QUEUED: { label: "Queued", tone: "plain" },
  RUNNING: { label: "Running", tone: "live" },
  DONE: { label: "Finished", tone: "plain" },
  CANCELLED: { label: "Cancelled", tone: "plain" },
  FAILED: { label: "Failed", tone: "hit" },
};

/** The strongest tint of a cell, as the share of the tint colour mixed into the surface. */
const MAX_TINT_PERCENT = 55;
/** Above 1 the tint falls off fast, so that only the cells near the best of a column stand out. */
const TINT_GAMMA = 3;
const BAR_CENTRE = 0.5;

export const runName = (run: RunSummary): string => `Run ${run.id}`;

/** The id of the run on screen: the wanted one, or the newest of `runs`, newest first, when there is no such run. */
export const shownRunId = (runs: RunSummary[], wanted: string | undefined): string | undefined =>
  runs.some((run) => run.id === wanted) ? wanted : runs[0]?.id;

/** The names with `name` switched on or off, in the order of `all`. */
export function toggled(all: string[], chosen: string[], name: string): string[] {
  const on = new Set(chosen);
  if (!on.delete(name)) on.add(name);
  return all.filter((each) => on.has(each));
}

/** The share of a run that is measured, counting the games of the pairing under way. */
export function runProgress(run: RunSummary): number {
  if (run.cellsTotal === 0) return 0;
  const underWay = run.cellsDone < run.cellsTotal ? run.cellGamesDone / run.games : 0;
  return Math.min(1, (run.cellsDone + underWay) / run.cellsTotal);
}

/** The next smaller size on offer, or the smallest when there is none. */
export function fewerGames(games: number): number {
  return GAME_SIZES.findLast((size) => size < games) ?? GAME_SIZES[0];
}

/** The pick that repeats a run, with only the names the engine still offers. */
export function pickOf(run: RunSummary, shooters: string[], layouts: string[]): RunPick {
  return {
    shooters: shooters.filter((name) => run.shooters.includes(name)),
    layouts: layouts.filter((name) => run.layouts.includes(name)),
    games: run.games,
    seed: Number.isInteger(run.seed) ? run.seed : DEFAULT_SEED,
  };
}

/** How much of the tint colour a cell gets, in percent, for a `good` of 0..1. */
export const tintPercent = (good: number): number => good ** TINT_GAMMA * MAX_TINT_PERCENT;

/** The height 0..1 of the bar of every shot count from `from` to `to`, the tallest being 1. */
export function histogramBars(histogram: number[], from: number, to: number): number[] {
  const counts = Array.from({ length: to - from + 1 }, (_, index) => histogram[from + index] ?? 0);
  const top = Math.max(...counts);
  return counts.map((count) => (top === 0 ? 0 : count / top));
}

/** Where a shot count lies on an axis of one bar per count from `from` to `to`: the middle of its bar, in percent. */
export function axisPercent(shots: number, from: number, to: number): number {
  return (clamp(shots, from, to) - from + BAR_CENTRE) * (PERCENT / (to - from + 1));
}

/** The lowest mean among the cells of a layout source. */
export function bestOfColumn(cells: Cell[], layout: string): number {
  return Math.min(...cells.filter((cell) => cell.layout === layout).map((cell) => cell.mean));
}

export const cellText = (key: CellKey): string => `${key.shooter} on ${key.layout}`;
