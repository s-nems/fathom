import type { GameRecord, Player, Ship, ShotRecord, ShotResult } from "@/data/api/types";
import { cellIndex } from "./board";
import { shipCells } from "./fleet";
import { opponentOf } from "./players";
import { clamp } from "@/lib/number";

/** What a board shows after some shots: the mark on each shot cell and the ships lost. */
export interface BoardState {
  marks: Map<number, ShotResult>;
  shotsTaken: number;
  /** SUNK results so far. A log can report a ship sunk without saying which, so `sunk` may hold fewer. */
  shipsSunk: number;
  sunk: Ship[];
}

/** A game frozen after `position` shots. `boards` is keyed by the owner of the fleet. */
export interface ReplayState {
  boards: Record<Player, BoardState>;
  latest: ShotRecord | null;
  next: ShotRecord | null;
}

const emptyBoard = (): BoardState => ({ marks: new Map(), shotsTaken: 0, shipsSunk: 0, sunk: [] });

function receive(board: BoardState, shot: ShotRecord): void {
  board.shotsTaken += 1;
  board.marks.set(cellIndex(shot.x, shot.y), shot.result);
  if (shot.result === "SUNK") board.shipsSunk += 1;
  if (shot.sunk === null) return;
  board.sunk.push(shot.sunk);
  for (const cell of shipCells(shot.sunk)) board.marks.set(cellIndex(cell.x, cell.y), "SUNK");
}

/** The state after the first `position` shots. A shot lands on the board of the other player. */
export function replayStateAt(game: GameRecord, position: number): ReplayState {
  const applied = clamp(position, 0, game.shots.length);
  const boards: Record<Player, BoardState> = { ONE: emptyBoard(), TWO: emptyBoard() };
  for (const shot of game.shots.slice(0, applied)) receive(boards[opponentOf(shot.player)], shot);
  return {
    boards,
    latest: applied > 0 ? game.shots[applied - 1] : null,
    next: applied < game.shots.length ? game.shots[applied] : null,
  };
}
