package io.github.snems.fathom.bot

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.cornerNeighbours
import io.github.snems.fathom.board.edgeNeighbours
import io.github.snems.fathom.board.isOnBoard
import jd.mg.ships.tournament.api.Direction.HORIZONTAL
import jd.mg.ships.tournament.api.Direction.VERTICAL
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

internal const val CELL_COUNT = Board.SIZE * Board.SIZE

/**
 * The cell as a number from 0 to 99, row by row, for use as an array index. The cell has to be on the board.
 */
internal fun Position.index(): Int = y * Board.SIZE + x

/**
 * A ship on the board with its cells and the cells around it as array indices, worked out once. [of] is the
 * only way to one, and it hands out the same candidate for every ship of a size the fleet has.
 */
internal class Candidate private constructor(
    val ship: ShipPlacement,
) {
    val cells: IntArray = ship.cells().map { it.index() }.toIntArray()

    /**
     * Cells that share an edge with the ship.
     */
    val neighbours: IntArray = ship.edgeNeighbours().map { it.index() }.toIntArray()

    val covered = Cells(cells)

    /**
     * The cells no other ship may cover, as bits: the ship's cells and the cells sharing an edge with it.
     */
    val claim = Cells(cells + neighbours)

    /**
     * The row a horizontal ship lies in, or the column of a vertical one.
     */
    private val line: Int =
        when (ship.direction) {
            HORIZONTAL -> ship.position.y
            VERTICAL -> ship.position.x
        }

    /**
     * Whether the ship lies in the first or last row or column, along it.
     */
    val isAlongEdge: Boolean = line == 0 || line == Board.SIZE - 1

    /**
     * Cells that touch the ship at a corner only. Rarely needed, so worked out on first use.
     */
    val corners: IntArray by lazy {
        val own = ship.cells()
        val beside = ship.edgeNeighbours()
        own.flatMap { it.cornerNeighbours() }
            .distinct()
            .filter { it !in own && it !in beside }
            .map { it.index() }
            .toIntArray()
    }

    companion object {
        /**
         * Every placement of every ship size of the fleet.
         */
        val BY_SIZE: Map<Int, List<Candidate>> =
            FLEET_SHIP_SIZES.distinct().associateWith { size -> Board.placementsOf(size).map(::Candidate) }

        private val BY_SHIP: Map<ShipPlacement, Candidate> = BY_SIZE.values.flatten().associateBy { it.ship }

        /**
         * @throws IllegalArgumentException if the ship does not lie on the board
         */
        fun of(ship: ShipPlacement): Candidate {
            BY_SHIP[ship]?.let { return it }
            require(ship.isOnBoard()) { "Not on the board: $ship" }
            return Candidate(ship)
        }
    }
}
