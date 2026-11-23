import type { Cell, Run, RunRequest, RunSummary } from "@/data/api/types";
import { Cancelled } from "@/data/engine/pool";
import type { Store } from "@/data/storage/store";
import { addCounts, chunkGames, planChunks, type Chunk } from "./chunks";
import {
  interrupted,
  isActive,
  newestFirst,
  nextId,
  oldestFirst,
  pairingsLeft,
  queued,
  resumed,
  running,
  stopped,
  summaryOf,
  withCell,
  withGames,
  type Pairing,
} from "./runState";
import { messageOf } from "@/lib/failure";

/** The two calls of the engine a run needs. */
export interface ArenaEngine {
  cellChunk(
    request: Pairing & { seed: number; firstGame: number; games: number },
    signal: AbortSignal,
  ): Promise<{ histogram: number[] }>;
  measurement(request: Pairing & { histogram: number[] }): Promise<Cell>;
}

/**
 * Says which tab runs a run, so that two tabs do not measure the same one. A tab holds a run while it runs it,
 * and the browser lets go of it when the tab closes.
 */
export interface RunLocks {
  /** Waits until no tab holds the run, then holds it until `work` settles. */
  hold(id: string, work: () => Promise<void>): Promise<void>;
}

export interface ArenaOptions {
  /** Without locks a run cannot be told from one another tab is running, so none is taken up again. */
  locks?: RunLocks;
  /** Workers of the engine, to give each a part of a short cell. */
  workers?: number;
}

const MIN_GAMES = 2;
export const MAX_GAMES = 10_000;

const UNKNOWN_FAILURE = "The run failed.";

const SINGLE_WORKER = 1;

interface Live {
  run: Run;
  stop: AbortController;
  /** Settles when the run has ended in this tab. */
  ended: Promise<void>;
  finish: () => void;
}

function checked(request: RunRequest): RunRequest {
  if (!Number.isInteger(request.games) || request.games < MIN_GAMES || request.games > MAX_GAMES) {
    throw new RangeError(`A run takes ${MIN_GAMES} to ${MAX_GAMES} games per cell.`);
  }
  if (!Number.isInteger(request.seed)) throw new RangeError("The seed is a whole number.");
  if (request.shooters.length === 0 || request.layouts.length === 0) {
    throw new RangeError("A run needs at least one shooter and one layout source.");
  }
  return request;
}

/**
 * The arena runs of this browser. A run measures its cells one after another, each in chunks spread over the
 * engine's workers, and is stored after every cell. Runs execute one at a time, later ones wait as queued.
 * A run whose tab was closed or reloaded is taken up again at its first cell without a result.
 */
export class ArenaRuns {
  private readonly live = new Map<string, Live>();
  /** Runs of another tab this one waits to take up, should that tab close. */
  private readonly watched = new Set<string>();
  /** Runs this tab could not store the end of, so that it does not take them up for ever. */
  private readonly abandoned = new Set<string>();
  private line: Promise<void> = Promise.resolve();
  private readonly locks?: RunLocks;
  private readonly workers: number;

  constructor(
    private readonly engine: ArenaEngine,
    private readonly store: Store<Run>,
    private readonly now: () => Date,
    { locks, workers = SINGLE_WORKER }: ArenaOptions = {},
  ) {
    this.locks = locks;
    this.workers = workers;
  }

  /**
   * Takes up the stored runs that no tab is running. Without locks they are stored as cancelled instead.
   * Call it once, before anything else.
   */
  async resume(): Promise<void> {
    if (this.locks !== undefined) {
      await this.all();
      return;
    }
    const left = (await this.store.list()).filter((run) => isActive(run.status) && !this.live.has(run.id));
    await Promise.all(left.map((run) => this.store.put(interrupted(run))));
  }

  /** Every run without its cells, newest first. */
  async list(): Promise<RunSummary[]> {
    return newestFirst(await this.all()).map(summaryOf);
  }

  async find(id: string): Promise<Run | undefined> {
    const stored = await this.store.get(id);
    return this.live.get(id)?.run ?? (stored === undefined ? undefined : this.asStored(stored));
  }

  async start(request: RunRequest): Promise<Run> {
    const run = queued(nextId(await this.all()), checked(request), this.now());
    const { ended } = this.enter(run);
    void this.locks?.hold(run.id, () => ended).catch(() => undefined);
    await this.store.put(run);
    this.line = this.line.then(() => this.execute(run.id));
    return run;
  }

  /**
   * Cancels a run that is queued or running, here or in another tab, and keeps it. Deletes any other. False
   * when there is no such run.
   */
  async remove(id: string): Promise<boolean> {
    const live = this.live.get(id);
    if (live !== undefined) {
      live.stop.abort();
      if (live.run.status === "QUEUED") await this.end(id, stopped(live.run, "CANCELLED"));
      return true;
    }
    const stored = await this.store.get(id);
    if (stored === undefined) return false;
    // A run of another tab is stored as cancelled, and that tab stops at its next cell.
    if (this.asStored(stored) === stored && isActive(stored.status)) await this.store.put(stopped(stored, "CANCELLED"));
    else await this.store.delete(id);
    return true;
  }

  /** Forgets every run. Runs under way are cancelled and have ended before anything is deleted. */
  async clear(): Promise<void> {
    for (const id of [...this.live.keys()]) await this.remove(id);
    await this.line;
    await this.store.clear();
  }

  private async all(): Promise<Run[]> {
    const stored = (await this.store.list()).filter((run) => !this.live.has(run.id));
    oldestFirst(stored).forEach((run) => this.watch(run));
    return [...stored.map((run) => this.asStored(run)), ...[...this.live.values()].map((live) => live.run)];
  }

  /** A stored run that is not running here. With locks an active one is running in another tab. */
  private asStored(run: Run): Run {
    return this.locks === undefined || this.abandoned.has(run.id) ? interrupted(run) : run;
  }

  private enter(run: Run): Live {
    let finish = () => {};
    const ended = new Promise<void>((resolve) => (finish = resolve));
    const live: Live = { run, stop: new AbortController(), ended, finish };
    this.live.set(run.id, live);
    return live;
  }

  private leave(id: string): void {
    this.live.get(id)?.finish();
    this.live.delete(id);
  }

  /** Waits for an active run of another tab to be let go of, and takes it up if it is still not ended. */
  private watch({ id, status }: Run): void {
    if (this.locks === undefined || !isActive(status) || this.watched.has(id) || this.abandoned.has(id)) return;
    this.watched.add(id);
    void this.locks
      .hold(id, () => this.takeUp(id))
      .catch(() => undefined)
      .finally(() => this.watched.delete(id));
  }

  private async takeUp(id: string): Promise<void> {
    const stored = await this.store.get(id);
    if (stored === undefined || !isActive(stored.status) || this.live.has(id)) return;
    const { ended } = this.enter(resumed(stored));
    this.line = this.line.then(() => this.execute(id));
    await ended;
  }

  private async execute(id: string): Promise<void> {
    const live = this.live.get(id);
    if (live === undefined) return;
    this.update(id, running);
    try {
      for (const pairing of pairingsLeft(live.run)) {
        const cell = await this.measure(id, pairing, live.stop.signal);
        const kept = await this.store.get(id);
        if (kept === undefined) {
          // Another tab forgot the run, so nothing of it is written back.
          this.leave(id);
          return;
        }
        if (!isActive(kept.status)) throw new Cancelled();
        await this.store.put(this.update(id, (run) => withCell(run, cell)));
      }
      await this.end(id, stopped(live.run, "DONE"));
    } catch (cause) {
      live.stop.abort();
      const failure = messageOf(cause, UNKNOWN_FAILURE);
      const last = cause instanceof Cancelled ? stopped(live.run, "CANCELLED") : stopped(live.run, "FAILED", failure);
      await this.end(id, last).catch(() => {
        this.abandoned.add(id);
        this.leave(id);
      });
    }
  }

  private async measure(id: string, pairing: Pairing, signal: AbortSignal): Promise<Cell> {
    const { games, seed } = this.live.get(id)!.run;
    let histogram: number[] = [];
    const count = async (chunk: Chunk) => {
      const part = await this.engine.cellChunk({ ...pairing, seed, ...chunk }, signal);
      histogram = addCounts(histogram, part.histogram);
      this.update(id, (run) => withGames(run, chunk.games));
    };
    await Promise.all(planChunks(games, chunkGames(games, this.workers)).map(count));
    return this.engine.measurement({ ...pairing, histogram });
  }

  private update(id: string, change: (run: Run) => Run): Run {
    const live = this.live.get(id)!;
    live.run = change(live.run);
    return live.run;
  }

  private async end(id: string, last: Run): Promise<void> {
    await this.store.put(last);
    this.leave(id);
  }
}
