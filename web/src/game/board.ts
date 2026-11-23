export const BOARD_SIZE = 10;
export const CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

const FIRST_COLUMN_LETTER = "A".charCodeAt(0);

/** A cell of the board: x is the column, y the row, (0,0) top left. */
export interface Point {
  x: number;
  y: number;
}

export const cellIndex = (x: number, y: number): number => y * BOARD_SIZE + x;

export const cellPoint = (index: number): Point => ({
  x: index % BOARD_SIZE,
  y: Math.floor(index / BOARD_SIZE),
});

export const isOnBoard = (x: number, y: number): boolean => x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;

export const columnLabel = (x: number): string => String.fromCharCode(FIRST_COLUMN_LETTER + x);

export const rowLabel = (y: number): string => String(y + 1);

/** The name players use for a cell: (0,0) is A1, (9,9) is J10. */
export const cellName = (x: number, y: number): string => columnLabel(x) + rowLabel(y);

export const LINE_INDICES: readonly number[] = Array.from({ length: BOARD_SIZE }, (_, i) => i);
export const CELL_INDICES: readonly number[] = Array.from({ length: CELL_COUNT }, (_, i) => i);
