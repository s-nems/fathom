/// <reference lib="webworker" />
import type { EngineCall, WorkerMessage } from "./protocol";
import { messageOf } from "@/lib/failure";

/** A worker with its own instance of the engine. It answers one call at a time, in the order they arrive. */

declare const self: DedicatedWorkerGlobalScope;

const UNKNOWN_FAILURE = "The engine did not load.";

const post = (message: WorkerMessage) => self.postMessage(message);
const reason = (cause: unknown): string => messageOf(cause, UNKNOWN_FAILURE);

const engine = import("./bundle/fathom-engine.mjs");
engine.then(
  () => post({ kind: "ready" }),
  (cause: unknown) => post({ kind: "failed", message: reason(cause) }),
);

// The handler is set before the engine has loaded, so that a call posted meanwhile is not lost.
self.onmessage = async ({ data }: MessageEvent<EngineCall>) => {
  try {
    const functions = (await engine) as unknown as Record<string, (...args: string[]) => string>;
    post({ kind: "answer", id: data.id, json: functions[data.fn](...data.args) });
  } catch (cause) {
    post({ kind: "thrown", id: data.id, message: reason(cause) });
  }
};
