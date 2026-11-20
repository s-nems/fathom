package io.github.snems.fathom.game

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.cells
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import jd.mg.ships.tournament.api.Shot
import jd.mg.ships.tournament.api.ShotResult

/** A fleet being shot at. Remembers the shots it has received and answers each new one. */
class FleetUnderFire(
    fleet: Fleet,
) {
    private val shipAt: Map<Position, ShipPlacement> =
        fleet.ships.flatMap { ship -> ship.cells().map { it to ship } }.toMap()
    private val shotAt = mutableSetOf<Position>()

    /** Whether every cell of every ship has been hit. */
    val isSunk: Boolean get() = shotAt.containsAll(shipAt.keys)

    /** Cells nobody has shot at yet, row by row. */
    fun unshot(): List<Position> = Board.positions.filterNot { it in shotAt }

    /** Whether the cell is on the board and has not been shot at. */
    fun accepts(position: Position): Boolean = position in Board && position !in shotAt

    /** @throws IllegalArgumentException if the board does not accept a shot at the cell */
    fun receive(position: Position): Shot {
        require(accepts(position)) { "Cannot shoot at $position" }
        shotAt += position
        val ship = shipAt[position] ?: return Shot(position, ShotResult.MISS)
        return if (shotAt.containsAll(ship.cells())) {
            Shot(position, ShotResult.SUNK, ship)
        } else {
            Shot(position, ShotResult.HIT)
        }
    }
}
