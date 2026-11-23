import { useSyncExternalStore } from "react";
import { engine } from "../api/client";
import type { EngineStatus } from "./status";

/** Whether the engine is loading, ready or failed, kept up to date. */
export function useEngineStatus(): EngineStatus {
  return useSyncExternalStore(engine.status.subscribe, engine.status.get);
}
