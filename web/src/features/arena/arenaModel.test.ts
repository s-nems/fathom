import { describe, expect, it } from "vitest";
import type { RunSummary } from "@/data/api/types";
import {
  axisPercent,
  fewerGames,
  histogramBars,
  pickOf,
  runProgress,
  shownRunId,
  tintPercent,
  toggled,
} from "./arenaModel";

const summary = (change: Partial<RunSummary>): RunSummary => ({
  id: "3",
  startedAt: "2026-01-01T10:00:00Z",
  games: 20,
  seed: 1,
  shooters: ["fathom", "random"],
  layouts: ["shuffled", "fathom"],
  status: "RUNNING",
  cellsDone: 0,
  cellsTotal: 4,
  cellGamesDone: 0,
  error: null,
  ...change,
});

describe("arena model", () => {
  it("should switch a name on in the order of the catalogue and off again", () => {
    // given
    const all = ["fathom", "density", "random"];

    // when
    const on = toggled(all, ["random"], "fathom");
    const off = toggled(all, on, "random");

    // then
    expect(on).toEqual(["fathom", "random"]);
    expect(off).toEqual(["fathom"]);
  });

  it("should count the games of the pairing under way into the progress", () => {
    // given
    const run = summary({ cellsDone: 1, cellGamesDone: 10 });

    // when
    const progress = runProgress(run);

    // then
    expect(progress).toBeCloseTo(0.375);
  });

  it("should call a finished run fully measured", () => {
    // given
    const run = summary({ status: "DONE", cellsDone: 4, cellGamesDone: 20 });

    // when
    const progress = runProgress(run);

    // then
    expect(progress).toBe(1);
  });

  it("should offer the next smaller size and stay at the smallest", () => {
    // given
    const games = [1000, 100, 20, 500];

    // when
    const sizes = games.map(fewerGames);

    // then
    expect(sizes).toEqual([100, 20, 20, 100]);
  });

  it("should repeat a run with only the names still on offer", () => {
    // given
    const run = summary({ games: 100, seed: 7, shooters: ["random", "gone", "fathom"] });

    // when
    const pick = pickOf(run, ["fathom", "density", "random"], ["sequential", "shuffled", "fathom"]);

    // then
    expect(pick).toEqual({ shooters: ["fathom", "random"], layouts: ["shuffled", "fathom"], games: 100, seed: 7 });
  });

  it("should tint the best of a column most and the worst not at all", () => {
    // given
    const good = [1, 0.5, 0];

    // when
    const tints = good.map(tintPercent);

    // then
    expect(tints[0]).toBe(55);
    expect(tints[1]).toBeLessThan(tints[0] / 2);
    expect(tints[2]).toBe(0);
  });

  it("should scale the bars of a histogram to the tallest within the range", () => {
    // given
    const histogram = [0, 0, 4, 8, 2];

    // when
    const bars = histogramBars(histogram, 2, 5);

    // then
    expect(bars).toEqual([0.5, 1, 0.25, 0]);
  });

  it.each([
    [0, 5],
    [4, 45],
    [9, 95],
    [-1, 5],
    [20, 95],
  ])("should put %d shots on an axis from 0 to 9 at %d percent, the middle of its bar", (shots, expected) => {
    // given
    const from = 0;
    const to = 9;

    // when
    const at = axisPercent(shots, from, to);

    // then
    expect(at).toBeCloseTo(expected);
  });

  it.each<[string | undefined, string | undefined]>([
    ["2", "2"],
    ["9", "3"],
    [undefined, "3"],
  ])("should show for the wanted run %s the run %s", (wanted, expected) => {
    // given
    const runs = [summary({ id: "3" }), summary({ id: "2" })];

    // when
    const shown = shownRunId(runs, wanted);

    // then
    expect(shown).toBe(expected);
  });

  it("should show no run when none is kept", () => {
    // given
    const runs: RunSummary[] = [];

    // when
    const shown = shownRunId(runs, "2");

    // then
    expect(shown).toBeUndefined();
  });
});
