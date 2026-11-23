/** The shapes the engine takes and gives, and what the page keeps of them. Change them only together with the engine. */

export type Player = "ONE" | "TWO";
export type Direction = "HORIZONTAL" | "VERTICAL";
export type ShotResult = "MISS" | "HIT" | "SUNK";
export type Ending = "FLEET_SUNK" | "ILLEGAL_MOVES" | "TIME_LIMIT";

/** First cell (x, y), then `size` cells to the right or down. x is the column, y the row, (0,0) top left. */
export interface Ship {
  size: number;
  x: number;
  y: number;
  direction: Direction;
}

/** A side of a game: a way of placing the fleet plus a way of shooting. */
export interface Contestant {
  layout: string;
  shooter: string;
}

export interface ShotRecord {
  player: Player;
  x: number;
  y: number;
  result: ShotResult;
  sunk: Ship | null;
  /** What the shooter thought of every cell before this shot, index = y * 10 + x. */
  weights: number[] | null;
  millis: number | null;
  /** "HH:mm:ss.SSS" from a log file. */
  at: string | null;
}

export interface GameResult {
  winner: Player;
  /** Null for a log that stopped with ships of the loser afloat: the log does not say why. */
  ending: Ending | null;
  shots: Record<Player, number>;
}

export interface GameRecord {
  title: string;
  players: Record<Player, string>;
  fleets: Record<Player, Ship[]>;
  shots: ShotRecord[];
  result: GameResult | null;
}

export interface Catalogue {
  layouts: string[];
  shooters: string[];
  boardSize: number;
  fleet: number[];
}

export type RunStatus = "QUEUED" | "RUNNING" | "DONE" | "CANCELLED" | "FAILED";

export interface RunSummary {
  id: string;
  startedAt: string;
  games: number;
  seed: number;
  shooters: string[];
  layouts: string[];
  status: RunStatus;
  cellsDone: number;
  cellsTotal: number;
  /** Games that came back of the cell being measured, out of `games`. */
  cellGamesDone: number;
  error: string | null;
}

export interface Cell {
  shooter: string;
  layout: string;
  mean: number;
  margin: number;
  /** histogram[n] = games that took exactly n shots. */
  histogram: number[];
}

export interface Run extends RunSummary {
  cells: Cell[];
}

export interface RunRequest {
  games: number;
  seed: number;
  shooters: string[];
  layouts: string[];
}

export interface GameRequest {
  one: Contestant;
  two: Contestant;
  seed: number;
  firstShooter: Player | null;
}

export interface LayoutHeatRequest {
  source: string;
  count: number;
  seed: number;
}

export interface LayoutHeat {
  source: string;
  count: number;
  cells: number[];
  bySize: Record<string, number[]>;
  samples: Ship[][];
}

export interface ShooterHeatRequest {
  shooter: string;
  layout: string;
  games: number;
  seed: number;
}

export interface ShooterHeat {
  shooter: string;
  layout: string;
  games: number;
  /** turns[t][cell] = games in which shot number t (0-based) went to the cell. */
  turns: number[][];
}

export interface PlayRequest {
  fleet: Ship[];
  opponent: Contestant;
  seed: number;
  firstShooter: Player | null;
}

/** A cell the human shoots at. */
export interface Target {
  x: number;
  y: number;
}

/**
 * A game of the human against a bot. The engine keeps no game, so the state carries what started it and
 * every shot of the human so far, and the next shot asks for the whole game again.
 */
export interface PlayState {
  request: PlayRequest;
  shots: Target[];
  game: GameRecord;
  yourTurn: boolean;
  over: boolean;
  /** The id the game is kept under in the history. Only on the answer that ended the game, and only if it was stored. */
  storedId?: string;
}

/** Who played a game kept in this browser: two bots, or the human against a bot. */
export type GameKind = "BOTS" | "HUMAN";

/** A finished game kept in this browser. */
export interface StoredGame {
  id: string;
  playedAt: string;
  kind: GameKind;
  game: GameRecord;
}

export interface StoredGameSummary {
  id: string;
  playedAt: string;
  kind: GameKind;
  title: string;
  winner: Player | null;
  shots: number;
}
