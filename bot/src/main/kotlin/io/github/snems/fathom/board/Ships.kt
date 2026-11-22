package io.github.snems.fathom.board

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement

val FLEET_SHIP_SIZES: List<Int> = listOf(5, 4, 4, 3, 3, 3, 2, 2, 2, 2)

fun ShipPlacement.cells(): List<Position> =
    (0..<size).map { step ->
        when (direction) {
            Direction.HORIZONTAL -> Position(position.x + step, position.y)
            Direction.VERTICAL -> Position(position.x, position.y + step)
        }
    }

/**
 * Whether the ship has at least one cell and all of its cells are on the board.
 */
fun ShipPlacement.isOnBoard(): Boolean = size in 1..Board.SIZE && cells().all { it in Board }

/**
 * Cells on the board that share an edge with this one.
 */
fun Position.edgeNeighbours(): List<Position> =
    listOf(Position(x - 1, y), Position(x + 1, y), Position(x, y - 1), Position(x, y + 1)).filter { it in Board }

/**
 * Cells on the board that touch this one at a corner only.
 */
fun Position.cornerNeighbours(): List<Position> {
    val diagonal =
        listOf(Position(x - 1, y - 1), Position(x + 1, y - 1), Position(x - 1, y + 1), Position(x + 1, y + 1))
    return diagonal.filter { it in Board }
}

/**
 * Cells on the board that share an edge with the ship and are not part of it.
 */
fun ShipPlacement.edgeNeighbours(): Set<Position> {
    val cells = cells()
    return cells.flatMapTo(mutableSetOf()) { it.edgeNeighbours() } - cells.toSet()
}

/**
 * Cells no other ship may cover: the cells of these ships and the cells that share an edge with them.
 */
fun Collection<ShipPlacement>.claimedCells(): Set<Position> =
    flatMapTo(mutableSetOf()) {
        it.cells() +
            it.edgeNeighbours()
    }

/**
 * Whether the ship lies on the board without overlapping or sharing an edge with any of the others.
 * Touching at a corner is allowed.
 */
fun ShipPlacement.fitsAmong(others: Collection<ShipPlacement>): Boolean {
    if (!isOnBoard()) return false
    val claimed = others.claimedCells()
    return cells().none { it in claimed }
}
