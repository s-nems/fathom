/** What the page and an engine worker say to each other. */

/** The functions of the engine. Each takes and returns strings, the answer is JSON. */
const ENGINE_FUNCTIONS = [
  "catalogue",
  "playGame",
  "playHumanGame",
  "readLog",
  "layoutHeat",
  "drawLayout",
  "shooterHeat",
  "cellChunk",
  "measurement",
] as const;
export type EngineFunction = (typeof ENGINE_FUNCTIONS)[number];

/** One call of the engine, numbered so that its answer can be told apart. */
export interface EngineCall {
  id: number;
  fn: EngineFunction;
  args: string[];
}

/** What a worker posts: that its engine loaded or did not, and the answer to each call. */
export type WorkerMessage =
  | { kind: "ready" }
  | { kind: "failed"; message: string }
  | { kind: "answer"; id: number; json: string }
  | { kind: "thrown"; id: number; message: string };

/** The answer of the engine once parsed: a value, or why there is none. */
export type EngineAnswer<T> = { value: T } | { error: string };

/** The part of a Worker the pool uses, so that a test can stand in for it. */
export interface WorkerLike {
  postMessage(call: EngineCall): void;
  terminate(): void;
  onmessage: ((event: { data: WorkerMessage }) => void) | null;
  onerror: ((event: { message?: string }) => void) | null;
}
