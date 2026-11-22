package io.github.snems.fathom.game

import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.fitsAmong
import jd.mg.ships.tournament.api.ShipPlacement

/**
 * The ships one player has placed so far. Placing a ship returns the next fleet and leaves this one unchanged.
 */
class Fleet private constructor(
    val ships: List<ShipPlacement>,
) {
    val remainingSizes: List<Int> = ships.fold(FLEET_SHIP_SIZES) { sizes, ship -> sizes - ship.size }

    val isComplete: Boolean get() = remainingSizes.isEmpty()

    fun accepts(ship: ShipPlacement): Boolean = ship.size in remainingSizes && ship.fitsAmong(ships)

    /**
     * @throws IllegalArgumentException if the fleet does not accept the ship
     */
    fun place(ship: ShipPlacement): Fleet {
        require(accepts(ship)) { "Cannot place $ship in a fleet of $ships" }
        return Fleet(ships + ship)
    }

    companion object {
        val EMPTY = Fleet(emptyList())
    }
}
