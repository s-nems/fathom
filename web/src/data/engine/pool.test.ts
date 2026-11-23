import { describe, expect, it } from "vitest";
import { Cancelled, EngineError, EnginePool, isCancelled } from "./pool";
import type { EngineCall, WorkerLike, WorkerMessage } from "./protocol";

/** A worker the test answers for. */
class FakeWorker implements WorkerLike {
  onmessage: ((event: { data: WorkerMessage }) => void) | null = null;
  onerror: ((event: { message?: string }) => void) | null = null;
  readonly calls: EngineCall[] = [];
  terminated = false;

  postMessage(call: EngineCall): void {
    this.calls.push(call);
  }

  terminate(): void {
    this.terminated = true;
  }

  say(message: WorkerMessage): void {
    this.onmessage?.({ data: message });
  }

  answer(value: unknown): void {
    this.say({ kind: "answer", id: this.calls.at(-1)!.id, json: JSON.stringify({ value }) });
  }
}

function pool(size: number) {
  const workers: FakeWorker[] = [];
  const spawn = () => {
    workers.push(new FakeWorker());
    return workers.at(-1)!;
  };
  return { workers, pool: new EnginePool(spawn, size) };
}

describe("engine pool", () => {
  it("should start no worker before the first call", () => {
    // given
    const size = 2;

    // when
    const { workers, pool: engine } = pool(size);

    // then
    expect(workers).toHaveLength(0);
    expect(engine.status.get()).toEqual({ state: "idle" });
  });

  it("should give the value of the answer", async () => {
    // given
    const { workers, pool: engine } = pool(2);

    // when
    const call = engine.call<number[]>("drawLayout", ['{"seed":1}']);
    workers[0].answer([1, 2]);

    // then
    expect(workers[0].calls[0]).toMatchObject({ fn: "drawLayout", args: ['{"seed":1}'] });
    await expect(call).resolves.toEqual([1, 2]);
  });

  it("should fail a call with the error the engine answered", async () => {
    // given
    const { workers, pool: engine } = pool(1);

    // when
    const call = engine.call("playGame", ["{}"]);
    workers[0].say({ kind: "answer", id: workers[0].calls[0].id, json: '{"error":"no such shooter"}' });

    // then
    await expect(call).rejects.toThrow(new EngineError("no such shooter"));
  });

  it("should use as many workers as it may and make the rest wait", async () => {
    // given
    const { workers, pool: engine } = pool(2);

    // when
    const calls = [1, 2, 3].map((n) => engine.call<number>("cellChunk", [String(n)]));
    const startedAtOnce = workers.map((worker) => worker.calls.length);
    workers[0].answer(1);
    workers[1].answer(2);
    workers[0].answer(3);

    // then
    expect(startedAtOnce).toEqual([1, 1]);
    expect(workers[0].calls.map((call) => call.args[0])).toEqual(["1", "3"]);
    await expect(Promise.all(calls)).resolves.toEqual([1, 2, 3]);
  });

  it("should follow the engine from loading to ready", () => {
    // given
    const { workers, pool: engine } = pool(1);
    const seen: string[] = [];
    engine.status.subscribe(() => seen.push(engine.status.get().state));

    // when
    void engine.call("catalogue", []);
    workers[0].say({ kind: "ready" });

    // then
    expect(seen).toEqual(["loading", "ready"]);
  });

  it("should fail the call and say so when the engine does not load, then try a fresh worker", async () => {
    // given
    const { workers, pool: engine } = pool(1);
    const first = engine.call("catalogue", []);

    // when
    workers[0].say({ kind: "failed", message: "no WebAssembly" });
    const second = engine.call<string>("catalogue", []);
    workers[1].answer("ok");

    // then
    await expect(first).rejects.toThrow("no WebAssembly");
    expect(workers[0].terminated).toBe(true);
    await expect(second).resolves.toBe("ok");
  });

  it("should end the worker of a call cancelled under way and leave the others alone", async () => {
    // given
    const { workers, pool: engine } = pool(2);
    const stop = new AbortController();
    const cancelled = engine.call("cellChunk", ["1"], { signal: stop.signal });
    const other = engine.call<number>("cellChunk", ["2"]);

    // when
    stop.abort();
    workers[1].answer(2);

    // then
    await expect(cancelled).rejects.toThrow(Cancelled);
    expect(workers.map((worker) => worker.terminated)).toEqual([true, false]);
    await expect(other).resolves.toBe(2);
  });

  it("should drop a waiting call that is cancelled without ending a worker", async () => {
    // given
    const { workers, pool: engine } = pool(1);
    const stop = new AbortController();
    const running = engine.call<number>("cellChunk", ["1"]);
    const waiting = engine.call("cellChunk", ["2"], { signal: stop.signal });

    // when
    stop.abort();
    workers[0].answer(1);

    // then
    await expect(waiting).rejects.toThrow(Cancelled);
    await expect(running).resolves.toBe(1);
    expect(workers).toHaveLength(1);
    expect(workers[0].calls).toHaveLength(1);
  });

  it("should fail the call of a worker that crashed", async () => {
    // given
    const { workers, pool: engine } = pool(1);
    const call = engine.call("cellChunk", ["1"]);

    // when
    workers[0].onerror?.({ message: "out of memory" });

    // then
    await expect(call).rejects.toThrow("out of memory");
  });

  it("should run an interactive call ahead of the background calls that wait", async () => {
    // given
    const { workers, pool: engine } = pool(1);
    void engine.call("cellChunk", ["1"], { priority: "BACKGROUND" });
    void engine.call("cellChunk", ["2"], { priority: "BACKGROUND" });
    void engine.call("cellChunk", ["3"], { priority: "BACKGROUND" });

    // when
    void engine.call("playHumanGame", ["shot"]);
    workers[0].answer(1);
    workers[0].answer(2);

    // then
    expect(workers[0].calls.map((call) => call.args[0])).toEqual(["1", "shot", "2"]);
  });

  it("should drop a waiting background call that is cancelled", async () => {
    // given
    const { workers, pool: engine } = pool(1);
    const stop = new AbortController();
    void engine.call("cellChunk", ["1"]);
    const waiting = engine.call("cellChunk", ["2"], { signal: stop.signal, priority: "BACKGROUND" });

    // when
    stop.abort();
    workers[0].answer(1);

    // then
    await expect(waiting).rejects.toSatisfy(isCancelled);
    expect(workers[0].calls).toHaveLength(1);
  });

  it("should keep a worker free of background calls for an interactive one", async () => {
    // given
    const { workers, pool: engine } = pool(3);
    void engine.call("cellChunk", ["1"], { priority: "BACKGROUND" });
    void engine.call("cellChunk", ["2"], { priority: "BACKGROUND" });
    void engine.call("cellChunk", ["3"], { priority: "BACKGROUND" });
    const started = workers.length;

    // when
    void engine.call("playHumanGame", ["shot"]);

    // then
    expect(started).toBe(2);
    expect(workers[2].calls.map((call) => call.args[0])).toEqual(["shot"]);
  });
});
