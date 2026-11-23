import { ArenaRuns, type RunLocks } from "@/features/arena/runs/arenaRuns";
import { addTables, planChunks } from "@/features/arena/runs/chunks";
import { EnginePool, type CallOptions } from "../engine/pool";
import type { EngineFunction, WorkerLike } from "../engine/protocol";
import { GameHistory } from "../storage/gameHistory";
import { openStorage, type Storage } from "../storage/storage";
import type {
  Catalogue,
  Cell,
  GameRecord,
  GameRequest,
  LayoutHeat,
  LayoutHeatRequest,
  PlayRequest,
  PlayState,
  Run,
  RunRequest,
  RunSummary,
  Ship,
  ShooterHeat,
  ShooterHeatRequest,
  StoredGame,
  StoredGameSummary,
  Target,
} from "./types";

/** A request that cannot be answered, with a status in the manner of HTTP to tell the kinds apart. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const NOT_FOUND = 404;

/** Whether a call was rejected because its signal was aborted, which is not a failure to show. */
export { isCancelled } from "../engine/pool";

/** Workers at most, however many cores the machine reports. Each holds its own copy of the engine. */
const MAX_WORKERS = 16;
/** Workers when the browser does not say how many cores there are. */
const DEFAULT_WORKERS = 4;

const workers = (): number => Math.min(navigator.hardwareConcurrency || DEFAULT_WORKERS, MAX_WORKERS);

const spawn = (): WorkerLike =>
  new Worker(new URL("../engine/worker.ts", import.meta.url), { type: "module" }) as unknown as WorkerLike;

const WORKERS = typeof navigator === "undefined" ? DEFAULT_WORKERS : workers();

/** The engine of the page. It starts no worker until the first call. */
export const engine = new EnginePool(spawn, WORKERS);

const ask = <T>(fn: EngineFunction, request?: unknown, options?: CallOptions): Promise<T> =>
  engine.call<T>(fn, request === undefined ? [] : [JSON.stringify(request)], options);

function once<T>(open: () => Promise<T>): () => Promise<T> {
  let opened: Promise<T> | undefined;
  return () => (opened ??= open());
}

/** Like `once`, but an answer that failed is asked for again by the next caller. */
function onceAnswered<T>(open: () => Promise<T>): () => Promise<T> {
  let opened: Promise<T> | undefined;
  return () => {
    const asked = (opened ??= open());
    asked.catch(() => {
      if (opened === asked) opened = undefined;
    });
    return asked;
  };
}

const storage = once<Storage>(() => openStorage(globalThis.indexedDB));
const now = () => new Date();

/** The name of the web lock a tab holds while it runs the run of an id. */
const RUN_LOCK = "fathom-arena-run-";

/** The web locks of the browser, or nothing where there are none. */
function runLocks(): RunLocks | undefined {
  const locks = globalThis.navigator?.locks;
  if (locks === undefined) return undefined;
  return { hold: (id, work) => locks.request(RUN_LOCK + id, work) };
}

const arena = once(async () => {
  const runs = new ArenaRuns(
    {
      cellChunk: (request, signal) => ask("cellChunk", request, { signal, priority: "BACKGROUND" }),
      measurement: (request) => ask<Cell>("measurement", request),
    },
    (await storage()).runs,
    now,
    { locks: runLocks(), workers: engine.backgroundWorkers },
  );
  await runs.resume();
  return runs;
});

const history = once(async () => new GameHistory((await storage()).games, now, () => crypto.randomUUID()));

async function humanGame(request: PlayRequest, shots: Target[]): Promise<PlayState> {
  const answer = await ask<Pick<PlayState, "game" | "yourTurn" | "over">>("playHumanGame", { ...request, shots });
  const state: PlayState = { request, shots, ...answer };
  if (!answer.over) return state;
  // A game that cannot be stored is still shown, without an id.
  const stored = await (await history()).add("HUMAN", answer.game).catch(() => undefined);
  return stored === undefined ? state : { ...state, storedId: stored.id };
}

async function shooterHeat(request: ShooterHeatRequest, signal?: AbortSignal): Promise<ShooterHeat> {
  const { games, ...rest } = request;
  const parts = await Promise.all(
    planChunks(games).map((chunk) => ask<ShooterHeat>("shooterHeat", { ...rest, ...chunk }, { signal })),
  );
  return {
    shooter: request.shooter,
    layout: request.layout,
    games,
    turns: parts.map((part) => part.turns).reduce(addTables, []),
  };
}

async function found<T>(value: Promise<T | undefined>, what: string): Promise<T> {
  const present = await value;
  if (present === undefined) throw new ApiError(`There is no ${what}.`, NOT_FOUND);
  return present;
}

/** Everything the views ask for. The engine answers on its workers, runs and games are kept in this browser. */
export const api = {
  /** What the engine offers. It is asked once, every caller gets the same answer. */
  catalogue: onceAnswered(() => ask<Catalogue>("catalogue")),

  runs: async (): Promise<RunSummary[]> => (await arena()).list(),
  startRun: async (body: RunRequest): Promise<Run> => (await arena()).start(body),
  run: async (id: string): Promise<Run> => found((await arena()).find(id), `run ${id}`),
  /** Cancels a run that is queued or running, deletes any other. */
  deleteRun: async (id: string): Promise<void> => {
    if (!(await (await arena()).remove(id))) throw new ApiError(`There is no run ${id}.`, NOT_FOUND);
  },

  /** Plays a game between two bots and keeps it in the history. The answer carries the id it is kept under. */
  playGame: async (body: GameRequest): Promise<StoredGame> =>
    (await history()).add("BOTS", await ask<GameRecord>("playGame", body)),
  /** A game between two bots that is only looked at, so it is not kept in the history. */
  watchGame: (body: GameRequest) => ask<GameRecord>("playGame", body),
  readLog: (name: string, text: string) => engine.call<GameRecord>("readLog", [name, text]),

  games: async (): Promise<StoredGameSummary[]> => (await history()).list(),
  game: async (id: string): Promise<StoredGame> => found((await history()).get(id), "such game"),

  /** Both heat maps take a signal that cancels the chunks waiting and under way; the call then rejects as `isCancelled`. */
  layoutHeat: (request: LayoutHeatRequest, signal?: AbortSignal) => ask<LayoutHeat>("layoutHeat", request, { signal }),
  drawLayout: (source: string, seed: number) => ask<Ship[]>("drawLayout", { source, seed }),
  shooterHeat,

  startPlay: (body: PlayRequest) => humanGame(body, []),
  shoot: (play: PlayState, x: number, y: number) => humanGame(play.request, [...play.shots, { x, y }]),

  /** Whether runs and games outlast the page. False when the browser gave no storage. */
  keepsHistory: async (): Promise<boolean> => (await storage()).persistent,
  /** Forgets every arena run and keeps the games. Runs under way are cancelled first. */
  clearRuns: async (): Promise<void> => (await arena()).clear(),
  /** Forgets every run and game. Runs under way are cancelled first. */
  clearHistory: async (): Promise<void> => {
    await Promise.all([(await arena()).clear(), (await history()).clear()]);
  },
};
