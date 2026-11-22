package io.github.snems.fathom.arena.layouts

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.claimedCells
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/**
 * Places ship after ship, each at random among the placements still legal, and starts over at a dead end.
 * [shuffled] places the ships in a random order of sizes instead of largest first.
 */
class SequentialLayouts(
    private val shuffled: Boolean,
) : LayoutSource {
    override fun layout(random: Random): List<ShipPlacement> {
        while (true) {
            val sizes = if (shuffled) FLEET_SHIP_SIZES.shuffled(random) else FLEET_SHIP_SIZES
            attempt(sizes, random)?.let { return it }
        }
    }

    private fun attempt(
        sizes: List<Int>,
        random: Random,
    ): List<ShipPlacement>? {
        val ships = mutableListOf<ShipPlacement>()
        for (size in sizes) {
            val claimed = ships.claimedCells()
            val fitting = Board.placementsOf(size).filter { ship -> ship.cells().none { it in claimed } }
            ships += fitting.randomOrNull(random) ?: return null
        }
        return ships
    }
}
