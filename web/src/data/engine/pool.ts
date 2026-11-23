import type { EngineAnswer, EngineCall, EngineFunction, WorkerLike, WorkerMessage } from "./protocol";
import { Observable, type EngineStatus } from "./status";

/** A call the engine refused or that never got an answer. */
export class EngineError extends Error {}

/** A call that was cancelled before its answer came. */
export class Cancelled extends Error {
  constructor() {
    super("Cancelled.");
  }
}

const WORKER_CRASHED = "An engine worker stopped unexpectedly.";
const NOT_JSON = "The engine sent an answer that is not JSON.";

/** Calls that can wait, as the chunks of an arena run: every other call goes ahead of them. */
export type Priority = "INTERACTIVE" | "BACKGROUND";

export interface CallOptions {
  /** Cancels the call, whether it waits or runs. */
  signal?: AbortSignal;
  /** INTERACTIVE unless said otherwise. */
  priority?: Priority;
}

export const isCancelled = (cause: unknown): cause is Cancelled => cause instanceof Cancelled;

/** Workers that take no background call, so that an interactive call does not wait for a chunk to end. */
const KEPT_FOR_INTERACTIVE = 1;

interface Task {
  call: EngineCall;
  priority: Priority;
  resolve: (value: unknown) => void;
  reject: (cause: Error) => void;
  signal?: AbortSignal;
  onAbort: () => void;
}

interface Slot {
  worker: WorkerLike;
  task: Task | null;
}

function parsed(json: string): unknown {
  let answer: EngineAnswer<unknown>;
  try {
    answer = JSON.parse(json) as EngineAnswer<unknown>;
  } catch {
    throw new EngineError(NOT_JSON);
  }
  if ("error" in answer) throw new EngineError(answer.error);
  return answer.value;
}

/**
 * Engine workers, started as calls need them up to a fixed number. A worker runs one call at a time and the
 * rest wait in two lines: background calls get a worker only when no interactive call waits, and never the
 * last one. Cancelling a call under way ends its worker, since nothing else stops the engine.
 */
export class EnginePool {
  readonly status = new Observable<EngineStatus>({ state: "idle" });
  private readonly slots: Slot[] = [];
  private readonly waiting: Task[] = [];
  private readonly background: Task[] = [];
  private calls = 0;

  constructor(
    private readonly spawn: () => WorkerLike,
    private readonly size: number,
  ) {}

  /** Workers that background calls can have at the same time. */
  get backgroundWorkers(): number {
    return Math.max(1, this.size - KEPT_FOR_INTERACTIVE);
  }

  /** Calls the engine on a free worker and gives the value of its answer. */
  call<T>(fn: EngineFunction, args: string[], { signal, priority = "INTERACTIVE" }: CallOptions = {}): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Cancelled());
        return;
      }
      const task: Task = {
        call: { id: ++this.calls, fn, args },
        priority,
        resolve: resolve as (value: unknown) => void,
        reject,
        signal,
        onAbort: () => this.cancel(task),
      };
      signal?.addEventListener("abort", task.onAbort);
      (priority === "BACKGROUND" ? this.background : this.waiting).push(task);
      this.dispatch();
    });
  }

  private dispatch(): void {
    for (;;) {
      const line = this.waiting.length > 0 ? this.waiting : this.background;
      if (line.length === 0 || (line === this.background && !this.hasRoomForBackground())) return;
      const slot = this.slots.find((candidate) => candidate.task === null) ?? this.grow();
      if (slot === undefined) return;
      const task = line.shift()!;
      slot.task = task;
      slot.worker.postMessage(task.call);
    }
  }

  private hasRoomForBackground(): boolean {
    const busy = this.slots.filter((slot) => slot.task?.priority === "BACKGROUND").length;
    return busy < this.backgroundWorkers;
  }

  private grow(): Slot | undefined {
    if (this.slots.length >= this.size) return undefined;
    if (this.status.get().state !== "ready") this.status.set({ state: "loading" });
    const slot: Slot = { worker: this.spawn(), task: null };
    slot.worker.onmessage = ({ data }) => this.receive(slot, data);
    slot.worker.onerror = ({ message }) => this.lose(slot, message ?? WORKER_CRASHED);
    this.slots.push(slot);
    return slot;
  }

  private receive(slot: Slot, message: WorkerMessage): void {
    switch (message.kind) {
      case "ready":
        this.status.set({ state: "ready" });
        return;
      case "failed":
        this.status.set({ state: "failed", message: message.message });
        this.lose(slot, message.message);
        return;
      case "answer":
        this.settle(slot, message.id, (task) => task.resolve(parsed(message.json)));
        return;
      case "thrown":
        this.settle(slot, message.id, () => {
          throw new EngineError(message.message);
        });
    }
  }

  private settle(slot: Slot, id: number, finish: (task: Task) => void): void {
    const task = slot.task;
    if (task === null || task.call.id !== id) return;
    this.release(slot);
    try {
      finish(task);
    } catch (cause) {
      task.reject(cause as Error);
    }
    this.dispatch();
  }

  /** Gives up a worker that cannot go on, and fails the call it had. Later calls start a fresh one. */
  private lose(slot: Slot, message: string): void {
    const task = slot.task;
    this.release(slot);
    this.retire(slot);
    task?.reject(new EngineError(message));
    this.dispatch();
  }

  private cancel(task: Task): void {
    const line = this.waiting.includes(task) ? this.waiting : this.background;
    const queued = line.indexOf(task);
    const slot = this.slots.find((candidate) => candidate.task === task);
    if (queued >= 0) line.splice(queued, 1);
    else if (slot !== undefined) {
      this.release(slot);
      this.retire(slot);
    } else return;
    task.signal?.removeEventListener("abort", task.onAbort);
    task.reject(new Cancelled());
    this.dispatch();
  }

  private release(slot: Slot): void {
    slot.task?.signal?.removeEventListener("abort", slot.task.onAbort);
    slot.task = null;
  }

  private retire(slot: Slot): void {
    slot.worker.terminate();
    this.slots.splice(this.slots.indexOf(slot), 1);
  }
}
