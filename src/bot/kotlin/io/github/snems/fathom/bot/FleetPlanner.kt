package io.github.snems.fathom.bot

import io.github.snems.fathom.board.isOnBoard
import jd.mg.ships.tournament.api.ShipPlacement

/**
 * Answers the referee ship by ship. It follows a layout drafted in advance while the referee accepts it, and
 * drafts a new one around the accepted ships when the referee does not.
 */
internal class FleetPlanner(
    private val drafts: LayoutDrafts,
) {
    private var plan: List<ShipPlacement> = emptyList()
    private var lastAnswer: ShipPlacement? = null

    /** Placements the referee did not accept. */
    private val refused = mutableSetOf<ShipPlacement>()

    /**
     * The next ship to place: one of the first size the referee still wants, given the ships it has accepted.
     *
     * @throws NoSuchElementException if no ship of that size fits among the accepted ones
     */
    fun nextShip(
        accepted: List<ShipPlacement>,
        remainingSizes: List<Int>,
    ): ShipPlacement {
        lastAnswer?.takeIf { it !in accepted }?.let(::refuse)
        val placed = accepted.filter { it.isOnBoard() }
        val size = remainingSizes.first()
        val ship = planned(placed, size) ?: drafted(placed, remainingSizes)
        lastAnswer = ship
        return ship
    }

    /** The referee reads the rules more strictly than this bot, so the plan made under the bot's reading goes. */
    private fun refuse(ship: ShipPlacement) {
        refused += ship
        plan = emptyList()
    }

    /** The ship the plan has for this size, when the plan still contains everything that was accepted. */
    private fun planned(
        placed: List<ShipPlacement>,
        size: Int,
    ): ShipPlacement? = plan.takeIf { it.containsAll(placed) }?.firstOrNull { it.size == size && it !in placed }

    private fun drafted(
        placed: List<ShipPlacement>,
        remainingSizes: List<Int>,
    ): ShipPlacement {
        val cautious = refused.isNotEmpty()
        plan = drafts.best(placed, remainingSizes, refused, cautious)
            ?: drafts.best(placed, remainingSizes.take(1), refused, cautious)
            ?: drafts.best(placed, remainingSizes.take(1), refused, cautious = false)
            ?: throw NoSuchElementException("No ship of ${remainingSizes.first()} cells fits among $placed")
        return plan.first { it !in placed }
    }
}
