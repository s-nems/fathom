package io.github.snems.fathom.engine.board

import io.github.snems.fathom.board.Board
import jd.mg.ships.tournament.api.Position

/**
 * Number of cells on the board.
 */
internal val CELLS = Board.positions.size

/**
 * Ways a game can go by its number of shots: none, or any number up to one at every cell.
 */
internal val SHOT_COUNTS = CELLS + 1

/**
 * Place of the cell in a list of all cells, row by row from the top left corner.
 */
internal fun Position.cell(): Int = y * Board.SIZE + x
