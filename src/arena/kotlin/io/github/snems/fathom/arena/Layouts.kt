package io.github.snems.fathom.arena

import io.github.snems.fathom.board.Board
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.board.claimedCells
import io.github.snems.fathom.game.Fleet
import jd.mg.ships.tournament.api.Bot
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/** A way of placing a whole fleet. */
fun interface LayoutSource {
    fun layout(random: Random): List<ShipPlacement>
}

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

/** The fleets a bot places when it is asked ship by ship, as a tournament asks it. */
class BotLayouts(
    private val bot: (Random) -> Bot,
) : LayoutSource {
    override fun layout(random: Random): List<ShipPlacement> {
        val placer = bot(random)
        var fleet = Fleet.EMPTY
        while (!fleet.isComplete) {
            fleet = fleet.place(placer.placeShip(fleet.ships, fleet.remainingSizes))
        }
        return fleet.ships
    }
}

/** How often a layout source uses each placement, counted over many of its layouts. */
class PlacementFrequencies(
    source: LayoutSource,
    layouts: Int,
    seed: Long,
) {
    private val counts: Map<ShipPlacement, Int> =
        Random(seed).let { random -> List(layouts) { source.layout(random) }.flatten().groupingBy { it }.eachCount() }

    /** Times the placement was seen, plus one so that an unseen placement still counts. */
    fun weightOf(ship: ShipPlacement): Long = (counts[ship] ?: 0) + 1L
}
