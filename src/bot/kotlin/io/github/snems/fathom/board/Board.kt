package io.github.snems.fathom.board

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

/** The square board each player places ships on. */
object Board {
    const val SIZE = 10

    /** Every cell, row by row from the top left corner. */
    val positions: List<Position> = (0 until SIZE).flatMap { y -> (0 until SIZE).map { x -> Position(x, y) } }

    operator fun contains(position: Position): Boolean = position.x in 0 until SIZE && position.y in 0 until SIZE

    /** Every way a ship of this size lies fully on the board. */
    fun placementsOf(size: Int): List<ShipPlacement> =
        positions
            .flatMap { first -> Direction.entries.map { direction -> ShipPlacement(size, first, direction) } }
            .filter { it.isOnBoard() }
}
