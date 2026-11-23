import { describe, expect, it } from "vitest";
import type { Cell, Run, RunRequest } from "@/data/api/types";
import { Cancelled } from "@/data/engine/pool";
import { MemoryStore } from "@/data/storage/store";
import { ArenaRuns, MAX_GAMES, type ArenaEngine, type RunLocks } from "./arenaRuns";
import { CHUNK_GAMES } from "./chunks";

const REQUEST: RunRequest = { games: 50, seed: 7, shooters: ["fathom", "random"], layouts: ["shuffled"] };
const NOW = () => new Date("2026-11-22T10:00:00Z");
const HISTOGRAM_SIZE = 101;

type ChunkRequest = Parameters<ArenaEngine["cellChunk"]>[0];

/** A histogram with every game of the chunk in the bucket of its own number, so that sums can be checked. */
function histogramOf({ firstGame, games }: ChunkRequest): number[] {
  const histogram = new Array<number>(HISTOGRAM_SIZE).fill(0);
  for (let game = firstGame; game < firstGame + games; game++) histogram[game] += 1;
  return histogram;
}

const measured = ({ shooter, layout, histogram }: Parameters<ArenaEngine["measurement"]>[0]): Cell => ({
  shooter,
  layout,
  mean: histogram.reduce((sum, count) => sum + count, 0),
  margin: 0,
  histogram,
});

/** An engine that answers at once. */
const instant: ArenaEngine = {
  cellChunk: async (request) => ({ histogram: histogramOf(request) }),
  measurement: async (request) => measured(request),
};

/** An engine whose chunks wait until the test lets them go, in the order the test picks. */
function held() {
  const waiting: { request: ChunkRequest; release: () => void; fail: (cause: Error) => void }[] = [];
  const engine: ArenaEngine = {
    cellChunk: (request, signal) =>
      new Promise((resolve, reject) => {
        signal.addEventListener("abort", () => reject(new Cancelled()));
        waiting.push({ request, release: () => resolve({ histogram: histogramOf(request) }), fail: reject });
      }),
    measurement: async (request) => measured(request),
  };
  return { engine, waiting };
}

/** The locks the tabs of a test share. A tab that closes lets go of every run it held. */
class TabLocks {
  private readonly holders = new Map<string, object>();
  private readonly waiting: { id: string; grant: () => void }[] = [];

  of(tab: object): RunLocks {
    return {
      hold: (id, work) =>
        new Promise<void>((resolve) => {
          const grant = () => {
            this.holders.set(id, tab);
            void work().finally(() => {
              if (this.holders.get(id) === tab) this.free(id);
              resolve();
            });
          };
          if (this.holders.has(id)) this.waiting.push({ id, grant });
          else grant();
        }),
    };
  }

  close(tab: object): void {
    const held = [...this.holders].filter(([, holder]) => holder === tab).map(([id]) => id);
    held.forEach((id) => this.free(id));
  }

  private free(id: string): void {
    this.holders.delete(id);
    const next = this.waiting.findIndex((each) => each.id === id);
    if (next >= 0) this.waiting.splice(next, 1)[0].grant();
  }
}

const TAB_ONE = { tab: 1 };
const TAB_TWO = { tab: 2 };

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

async function finished(runs: ArenaRuns, id: string): Promise<Run> {
  for (;;) {
    const run = (await runs.find(id))!;
    if (run.status !== "QUEUED" && run.status !== "RUNNING") return run;
    await settled();
  }
}

describe("arena runs", () => {
  it("should measure every cell and store the run as done", async () => {
    // given
    const store = new MemoryStore<Run>();
    const runs = new ArenaRuns(instant, store, NOW);

    // when
    const started = await runs.start(REQUEST);
    const run = await finished(runs, started.id);

    // then
    expect(started.status).toBe("QUEUED");
    expect(run).toMatchObject({ status: "DONE", cellsDone: 2, cellsTotal: 2, cellGamesDone: 0 });
    expect(run.cells.map((cell) => cell.shooter)).toEqual(["fathom", "random"]);
    expect(run.cells[0].mean).toBe(REQUEST.games);
    expect(await store.get(started.id)).toEqual(run);
  });

  it("should sum a cell the same whatever order its chunks come back in", async () => {
    // given
    const { engine, waiting } = held();
    const runs = new ArenaRuns(engine, new MemoryStore<Run>(), NOW);
    const oneCell = { ...REQUEST, shooters: ["fathom"] };
    const expected = histogramOf({ ...oneCell, shooter: "fathom", layout: "shuffled", firstGame: 0 });

    // when
    const { id } = await runs.start(oneCell);
    await settled();
    [...waiting].reverse().forEach((chunk) => chunk.release());
    const run = await finished(runs, id);

    // then
    expect(waiting.map((chunk) => chunk.request.firstGame)).toEqual([0, CHUNK_GAMES, 2 * CHUNK_GAMES]);
    expect(run.cells[0].histogram).toEqual(expected);
  });

  it("should report the games of the cell under way", async () => {
    // given
    const { engine, waiting } = held();
    const runs = new ArenaRuns(engine, new MemoryStore<Run>(), NOW);

    // when
    const { id } = await runs.start(REQUEST);
    await settled();
    waiting[0].release();
    await settled();
    const run = await runs.find(id);

    // then
    expect(run).toMatchObject({ status: "RUNNING", cellsDone: 0, cellGamesDone: CHUNK_GAMES });
  });

  it("should keep the finished cells of a run cancelled half way", async () => {
    // given
    const { engine, waiting } = held();
    const store = new MemoryStore<Run>();
    const runs = new ArenaRuns(engine, store, NOW);
    const { id } = await runs.start(REQUEST);
    await settled();
    waiting.splice(0).forEach((chunk) => chunk.release());
    await settled();

    // when
    const known = await runs.remove(id);
    const run = await finished(runs, id);

    // then
    expect(known).toBe(true);
    expect(run).toMatchObject({ status: "CANCELLED", cellsDone: 1 });
    expect(await store.get(id)).toEqual(run);
  });

  it("should make a later run wait and let it be cancelled before it starts", async () => {
    // given
    const { engine, waiting } = held();
    const runs = new ArenaRuns(engine, new MemoryStore<Run>(), NOW);
    const first = await runs.start(REQUEST);
    const second = await runs.start(REQUEST);
    await settled();

    // when
    const waitingRun = await runs.find(second.id);
    await runs.remove(second.id);
    const cancelled = await runs.find(second.id);

    // then
    expect(waitingRun?.status).toBe("QUEUED");
    expect(cancelled).toMatchObject({ status: "CANCELLED", cellsDone: 0 });
    expect((await runs.find(first.id))?.status).toBe("RUNNING");
    expect(waiting.every((chunk) => chunk.request.seed === REQUEST.seed)).toBe(true);
  });

  it("should end a run as failed with the reason the engine gave", async () => {
    // given
    const { engine, waiting } = held();
    const runs = new ArenaRuns(engine, new MemoryStore<Run>(), NOW);
    const { id } = await runs.start(REQUEST);
    await settled();

    // when
    waiting[0].fail(new Error("no such shooter"));
    const run = await finished(runs, id);

    // then
    expect(run).toMatchObject({ status: "FAILED", error: "no such shooter", cellsDone: 0 });
  });

  it("should delete a finished run and not know a missing one", async () => {
    // given
    const runs = new ArenaRuns(instant, new MemoryStore<Run>(), NOW);
    const { id } = await runs.start(REQUEST);
    await finished(runs, id);

    // when
    const deleted = await runs.remove(id);
    const again = await runs.remove(id);

    // then
    expect(deleted).toBe(true);
    expect(again).toBe(false);
    expect(await runs.find(id)).toBeUndefined();
  });

  it("should list runs newest first and read one left running as cancelled", async () => {
    // given
    const store = new MemoryStore<Run>();
    const before = new ArenaRuns(held().engine, store, NOW);
    const left = await before.start(REQUEST);
    await settled();
    const runs = new ArenaRuns(instant, store, NOW);

    // when
    const next = await runs.start(REQUEST);
    await finished(runs, next.id);
    const list = await runs.list();

    // then
    expect(list.map((run) => [run.id, run.status])).toEqual([
      [next.id, "DONE"],
      [left.id, "CANCELLED"],
    ]);
    expect(list.every((run) => !("cells" in run))).toBe(true);
  });

  it("should refuse a run with too many games", async () => {
    // given
    const runs = new ArenaRuns(instant, new MemoryStore<Run>(), NOW);

    // when
    const starting = runs.start({ ...REQUEST, games: MAX_GAMES + 1 });

    // then
    await expect(starting).rejects.toThrow(RangeError);
  });

  it("should forget every run, also one under way", async () => {
    // given
    const store = new MemoryStore<Run>();
    const runs = new ArenaRuns(held().engine, store, NOW);
    await runs.start(REQUEST);
    await settled();

    // when
    await runs.clear();

    // then
    expect(await store.list()).toEqual([]);
    expect(await runs.list()).toEqual([]);
  });

  it("should give every worker a part of a cell shorter than a chunk", async () => {
    // given
    const { engine, waiting } = held();
    const runs = new ArenaRuns(engine, new MemoryStore<Run>(), NOW, { workers: 4 });

    // when
    await runs.start({ ...REQUEST, games: 10 });
    await settled();

    // then
    expect(waiting.map(({ request }) => [request.firstGame, request.games])).toEqual([
      [0, 3],
      [3, 3],
      [6, 3],
      [9, 1],
    ]);
  });

  it("should take up a run of a closed tab at its first cell without a result and end as if never stopped", async () => {
    // given
    const store = new MemoryStore<Run>();
    const locks = new TabLocks();
    const uninterrupted = new ArenaRuns(instant, new MemoryStore<Run>(), NOW);
    const expected = await finished(uninterrupted, (await uninterrupted.start(REQUEST)).id);
    const first = held();
    const one = new ArenaRuns(first.engine, store, NOW, { locks: locks.of(TAB_ONE) });
    const { id } = await one.start(REQUEST);
    await settled();
    first.waiting.forEach((chunk) => chunk.release());
    await settled();
    await settled();
    const asked: ChunkRequest[] = [];
    const second: ArenaEngine = {
      ...instant,
      cellChunk: async (request) => {
        asked.push(request);
        return { histogram: histogramOf(request) };
      },
    };

    // when
    locks.close(TAB_ONE);
    const two = new ArenaRuns(second, store, NOW, { locks: locks.of(TAB_TWO) });
    await two.resume();
    const run = await finished(two, id);

    // then
    expect((await store.get(id))?.cells).toHaveLength(2);
    expect(new Set(asked.map((request) => request.shooter))).toEqual(new Set(["random"]));
    expect(run).toEqual(expected);
  });

  it("should show a run another tab is running as it is stored and leave it alone", async () => {
    // given
    const store = new MemoryStore<Run>();
    const locks = new TabLocks();
    const one = new ArenaRuns(held().engine, store, NOW, { locks: locks.of(TAB_ONE) });
    const { id } = await one.start(REQUEST);
    await settled();
    const second = held();

    // when
    const two = new ArenaRuns(second.engine, store, NOW, { locks: locks.of(TAB_TWO) });
    await two.resume();
    await settled();
    const [listed] = await two.list();

    // then
    expect(listed).toMatchObject({ id, status: "QUEUED" });
    expect(second.waiting).toHaveLength(0);
  });

  it("should take up a run once the tab that ran it closes", async () => {
    // given
    const store = new MemoryStore<Run>();
    const locks = new TabLocks();
    const one = new ArenaRuns(held().engine, store, NOW, { locks: locks.of(TAB_ONE) });
    const { id } = await one.start(REQUEST);
    const two = new ArenaRuns(instant, store, NOW, { locks: locks.of(TAB_TWO) });
    await two.resume();

    // when
    locks.close(TAB_ONE);
    const run = await finished(two, id);

    // then
    expect(run).toMatchObject({ status: "DONE", cellsDone: 2 });
  });

  it("should store a run left under way as cancelled when the browser has no locks", async () => {
    // given
    const store = new MemoryStore<Run>();
    const { id } = await new ArenaRuns(held().engine, store, NOW).start(REQUEST);
    await settled();
    const reloaded = new ArenaRuns(instant, store, NOW);

    // when
    await reloaded.resume();

    // then
    expect(await store.get(id)).toMatchObject({ status: "CANCELLED", cellsDone: 0 });
  });

  it("should stop at the next cell a run that another tab cancelled, and keep the cells measured", async () => {
    // given
    const store = new MemoryStore<Run>();
    const locks = new TabLocks();
    const first = held();
    const one = new ArenaRuns(first.engine, store, NOW, { locks: locks.of(TAB_ONE) });
    const { id } = await one.start(REQUEST);
    await settled();
    const two = new ArenaRuns(instant, store, NOW, { locks: locks.of(TAB_TWO) });
    await two.resume();
    const chunksOfFirstCell = first.waiting.length;

    // when
    const removed = await two.remove(id);
    first.waiting.forEach((chunk) => chunk.release());
    const run = await finished(one, id);

    // then
    expect(removed).toBe(true);
    expect(run).toMatchObject({ status: "CANCELLED", cellsDone: 0 });
    expect(first.waiting).toHaveLength(chunksOfFirstCell);
    expect(await two.find(id)).toMatchObject({ status: "CANCELLED" });
  });

  it("should write nothing back of a run that another tab forgot", async () => {
    // given
    const store = new MemoryStore<Run>();
    const locks = new TabLocks();
    const first = held();
    const one = new ArenaRuns(first.engine, store, NOW, { locks: locks.of(TAB_ONE) });
    const { id } = await one.start(REQUEST);
    await settled();
    const two = new ArenaRuns(instant, store, NOW, { locks: locks.of(TAB_TWO) });

    // when
    await two.clear();
    first.waiting.forEach((chunk) => chunk.release());
    await settled();
    await settled();

    // then
    expect(await store.list()).toEqual([]);
    expect(await one.find(id)).toBeUndefined();
  });
});
