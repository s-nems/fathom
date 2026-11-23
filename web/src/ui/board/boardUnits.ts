import { BOARD_SIZE } from "@/game/board";

/** Side of one cell in the units of a board drawing. Layers draw in these units. */
export const CELL = 10;
export const HALF_CELL = CELL / 2;
export const BOARD_SIDE = CELL * BOARD_SIZE;
