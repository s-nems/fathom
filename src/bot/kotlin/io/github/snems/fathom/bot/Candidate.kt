package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.edgeNeighbours
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

internal const val CELL_COUNT = Board.SIZE * Board.SIZE

/** The cell as a number from 0 to 99, row by row, for use as an array index. The cell has to be on the board. */
internal fun Position.index(): Int = y * Board.SIZE + x

/** A ship on the board with its cells and the cells around it as array indices, worked out once. */
internal class Candidate(
    val ship: ShipPlacement,
) {
    val cells: IntArray = ship.cells().map { it.index() }.toIntArray()

    /** Cells that share an edge with the ship. */
    val neighbours: IntArray = ship.edgeNeighbours().map { it.index() }.toIntArray()

    /** Cells that touch the ship at a corner only. Rarely needed, so worked out on first use. */
    val corners: IntArray by lazy {
        val diagonal =
            ship.cells().flatMap { (x, y) ->
                listOf(Position(x - 1, y - 1), Position(x + 1, y - 1), Position(x - 1, y + 1), Position(x + 1, y + 1))
            }
        (diagonal.filter { it in Board }.map { it.index() }.toSet() - cells.toSet() - neighbours.toSet()).toIntArray()
    }

    companion object {
        /** Every placement of every ship size of the fleet. */
        val BY_SIZE: Map<Int, List<Candidate>> =
            FLEET_SHIP_SIZES.distinct().associateWith { size -> Board.placementsOf(size).map(::Candidate) }

        private val BY_SHIP: Map<ShipPlacement, Candidate> = BY_SIZE.values.flatten().associateBy { it.ship }

        /** The candidate for a ship that lies on the board. */
        fun of(ship: ShipPlacement): Candidate = BY_SHIP[ship] ?: Candidate(ship)
    }
}
