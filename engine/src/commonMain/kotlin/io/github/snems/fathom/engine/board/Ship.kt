package io.github.snems.fathom.engine.board

import jd.mg.ships.tournament.api.Direction
import jd.mg.ships.tournament.api.Position
import jd.mg.ships.tournament.api.ShipPlacement
import kotlinx.serialization.Serializable

/**
 * A ship as JSON: its first cell and the cells to the right of it or below it.
 */
@Serializable
internal data class Ship(
    val size: Int,
    val x: Int,
    val y: Int,
    val direction: Direction,
) {
    fun placement() = ShipPlacement(size, Position(x, y), direction)

    companion object {
        fun of(ship: ShipPlacement) = Ship(ship.size, ship.position.x, ship.position.y, ship.direction)
    }
}
