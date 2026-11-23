import { describe, expect, it } from "vitest";
import type { Cell, RunRequest } from "@/data/api/types";
import {
  interrupted,
  newestFirst,
  nextId,
  oldestFirst,
  pairingsLeft,
  pairingsOf,
  queued,
  resumed,
  running,
  stopped,
  summaryOf,
  withCell,
  withGames,
} from "./runState";

const REQUEST: RunRequest = { games: 100, seed: 1, shooters: ["fathom", "random"], layouts: ["shuffled", "fathom"] };
const STARTED = new Date("2026-11-22T10:00:00Z");
const CELL: Cell = { shooter: "fathom", layout: "shuffled", mean: 42, margin: 1, histogram: [0, 100] };

describe("run state", () => {
  it("should list the cells shooter by shooter", () => {
    // given
    const request = REQUEST;

    // when
    const pairings = pairingsOf(request);

    // then
    expect(pairings).toEqual([
      { shooter: "fathom", layout: "shuffled" },
      { shooter: "fathom", layout: "fathom" },
      { shooter: "random", layout: "shuffled" },
      { shooter: "random", layout: "fathom" },
    ]);
  });

  it("should start queued with nothing measured", () => {
    // given
    const id = "3";

    // when
    const run = queued(id, REQUEST, STARTED);

    // then
    expect(run).toMatchObject({ id: "3", status: "QUEUED", cellsDone: 0, cellsTotal: 4, cellGamesDone: 0, cells: [] });
    expect(run.startedAt).toBe("2026-11-22T10:00:00.000Z");
  });

  it("should count the games of the cell under way and start over with the next cell", () => {
    // given
    const started = running(queued("1", REQUEST, STARTED));

    // when
    const halfWay = withGames(withGames(started, 20), 20);
    const measured = withCell(halfWay, CELL);

    // then
    expect(halfWay.cellGamesDone).toBe(40);
    expect(measured).toMatchObject({ status: "RUNNING", cellsDone: 1, cellGamesDone: 0, cells: [CELL] });
  });

  it("should keep the finished cells of a run that stopped early", () => {
    // given
    const halfWay = withGames(withCell(running(queued("1", REQUEST, STARTED)), CELL), 20);

    // when
    const failed = stopped(halfWay, "FAILED", "no such shooter");

    // then
    expect(failed).toMatchObject({ status: "FAILED", error: "no such shooter", cellGamesDone: 0, cells: [CELL] });
  });

  it("should read a run left running by a closed page as cancelled", () => {
    // given
    const left = withCell(running(queued("1", REQUEST, STARTED)), CELL);
    const done = stopped(left, "DONE");

    // when
    const read = interrupted(left);

    // then
    expect(read).toMatchObject({ status: "CANCELLED", cells: [CELL] });
    expect(interrupted(done)).toBe(done);
  });

  it("should leave the cells out of a summary", () => {
    // given
    const run = withCell(running(queued("1", REQUEST, STARTED)), CELL);

    // when
    const summary = summaryOf(run);

    // then
    expect(summary).toMatchObject({ id: "1", cellsDone: 1 });
    expect(summary).not.toHaveProperty("cells");
  });

  it("should number runs upwards and list the newest first", () => {
    // given
    const runs = ["2", "10", "9"].map((id) => queued(id, REQUEST, STARTED));

    // when
    const next = nextId(runs);
    const ordered = newestFirst(runs).map((run) => run.id);

    // then
    expect(next).toBe("11");
    expect(ordered).toEqual(["10", "9", "2"]);
    expect(nextId([])).toBe("1");
  });

  it("should take a run up again as queued, with its cells and none of the games of the cell left half way", () => {
    // given
    const left = withGames(withCell(running(queued("1", REQUEST, STARTED)), CELL), 40);

    // when
    const run = resumed(left);

    // then
    expect(run).toMatchObject({ status: "QUEUED", cellsDone: 1, cellGamesDone: 0, cells: [CELL] });
  });

  it("should leave the cells without a result to measure, in order", () => {
    // given
    const run = withCell(queued("1", REQUEST, STARTED), CELL);

    // when
    const left = pairingsLeft(run);

    // then
    expect(left).toEqual(pairingsOf(REQUEST).slice(1));
  });

  it("should order runs by when they were started", () => {
    // given
    const runs = ["2", "10", "1"].map((id) => queued(id, REQUEST, STARTED));

    // when
    const ordered = oldestFirst(runs);

    // then
    expect(ordered.map((run) => run.id)).toEqual(["1", "2", "10"]);
  });
});
