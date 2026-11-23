import { describe, expect, it } from "vitest";
import type { Cell, Run, RunStatus } from "@/data/api/types";
import { arenaTable } from "./arenaTable";

const cell = (shooter: string, layout: string, mean: number): Cell => ({
  shooter,
  layout,
  mean,
  margin: 0.5,
  histogram: [],
});

function runOf(status: RunStatus, cells: Cell[], cellGamesDone = 0): Run {
  return {
    id: "1",
    startedAt: "2026-11-22T10:00:00.000Z",
    games: 100,
    seed: 1,
    shooters: ["random", "density", "fathom"],
    layouts: ["shuffled", "fathom"],
    status,
    cellsDone: cells.length,
    cellsTotal: 6,
    cellGamesDone,
    error: null,
    cells,
  };
}

const ALL = [
  cell("random", "shuffled", 95),
  cell("random", "fathom", 96),
  cell("density", "shuffled", 45),
  cell("density", "fathom", 55),
  cell("fathom", "shuffled", 42),
  cell("fathom", "fathom", 48),
];

describe("table of a run", () => {
  it("should rank the shooters by their average, best first", () => {
    // given
    const run = runOf("DONE", ALL);

    // when
    const table = arenaTable(run);

    // then
    expect(table.rows.map((row) => row.shooter)).toEqual(["fathom", "density", "random"]);
    expect(table.rows.map((row) => row.average)).toEqual([45, 50, 95.5]);
    expect(table.rows.map((row) => row.behind)).toEqual([0, 5, 50.5]);
  });

  it("should mark the best of each column and shade it fully", () => {
    // given
    const run = runOf("DONE", ALL);

    // when
    const [best] = arenaTable(run).rows;

    // then
    expect(best.slots).toEqual([
      { kind: "done", cell: ALL[4], good: 1, best: true },
      { kind: "done", cell: ALL[5], good: 1, best: true },
    ]);
  });

  it("should say who needs the fewest shots and by how much", () => {
    // given
    const run = runOf("DONE", ALL);

    // when
    const { verdict } = arenaTable(run);

    // then
    expect(verdict).toEqual({ best: "fathom", average: 45, second: { shooter: "density", behind: 5 } });
  });

  it("should keep the order of the run and give no verdict before a column is complete", () => {
    // given: shooter by shooter, the first is done and the second half way through its first pairing
    const run = runOf("RUNNING", ALL.slice(0, 2), 40);

    // when
    const table = arenaTable(run);

    // then
    expect(table.verdict).toBeNull();
    expect(table.rows.map((row) => row.shooter)).toEqual(["random", "density", "fathom"]);
    expect(table.rows[1].slots).toEqual([{ kind: "running", gamesDone: 40 }, { kind: "queued" }]);
    expect(table.rows[2].slots).toEqual([{ kind: "queued" }, { kind: "queued" }]);
  });

  it("should show the pairings a stopped run never reached as skipped", () => {
    // given
    const run = runOf("CANCELLED", ALL.slice(0, 5));

    // when
    const table = arenaTable(run);

    // then
    expect(table.rows.find((row) => row.shooter === "fathom")?.slots[1]).toEqual({ kind: "skipped" });
  });

  it("should average only over the layout sources every shooter was measured on", () => {
    // given
    const run = runOf("CANCELLED", ALL.slice(0, 5));

    // when
    const table = arenaTable(run);

    // then
    expect(table.rows.map((row) => [row.shooter, row.average])).toEqual([
      ["fathom", 42],
      ["density", 45],
      ["random", 95],
    ]);
  });
});
