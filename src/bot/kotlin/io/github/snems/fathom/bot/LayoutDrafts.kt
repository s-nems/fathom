package io.github.snems.fathom.bot

import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random
import kotlin.time.TimeMark

/** How the bot lays out its fleet. */
internal class LayoutPolicy(
    /** Ships of at least this many cells are the long ones. Shorter ships go anywhere. */
    val longShipSize: Int = 3,
    /** Chance that a long ship is laid along an edge of the board. */
    val edgeChance: Double = 0.8,
    /** Layouts drawn before the one with the most free cells is kept. */
    val drafts: Int = 20,
)

/**
 * Draws random layouts and keeps the best. A sunk ship shows the opponent that the cells sharing an edge with it
 * are empty, and a ship along an edge has about half as many such cells. So the drafts favour the edges for the
 * long ships, and the best draft is the one that leaves the most cells neither occupied nor next to a ship.
 */
internal class LayoutDrafts(
    private val random: Random,
    private val policy: LayoutPolicy,
) {
    /**
     * The best of several random layouts that add ships of [sizes], in that order, to [placed], or null when
     * every draft ran into a dead end. No draft uses a ship from [refused]. A [cautious] draft also keeps ships
     * apart at corners. Drafting stops at the [deadline], with at least one layout drawn.
     */
    fun best(
        placed: List<ShipPlacement>,
        sizes: List<Int>,
        refused: Set<ShipPlacement>,
        cautious: Boolean,
        deadline: TimeMark,
    ): List<ShipPlacement>? {
        var best: List<ShipPlacement>? = null
        var mostFree = -1
        var drawn = 0
        while (drawn < policy.drafts && (drawn == 0 || deadline.hasNotPassedNow())) {
            val layout = draft(placed, sizes, refused, cautious)
            val free = layout?.let(::freeCells) ?: -1
            if (free > mostFree) {
                best = layout
                mostFree = free
            }
            drawn++
        }
        return best
    }

    private fun draft(
        placed: List<ShipPlacement>,
        sizes: List<Int>,
        refused: Set<ShipPlacement>,
        cautious: Boolean,
    ): List<ShipPlacement>? {
        val taken = CellSet()
        placed.forEach { claim(Candidate.of(it), taken, cautious) }
        val layout = placed.toMutableList()
        for (size in sizes) {
            val fitting = Candidate.BY_SIZE.getValue(size).filter { !taken.overlaps(it.covered) && it.ship !in refused }
            val favoursEdge = size >= policy.longShipSize && random.nextDouble() < policy.edgeChance
            val alongEdge = if (favoursEdge) fitting.filter { it.isAlongEdge } else emptyList()
            val choice = alongEdge.ifEmpty { fitting }.randomOrNull(random) ?: return null
            claim(choice, taken, cautious)
            layout += choice.ship
        }
        return layout
    }

    /** Marks the cells no later ship may cover. A cautious draft also keeps the corners around the ship free. */
    private fun claim(
        candidate: Candidate,
        taken: CellSet,
        cautious: Boolean,
    ) {
        taken.add(candidate.claim)
        if (cautious) candidate.corners.forEach(taken::add)
    }

    /** Cells that are neither part of a ship nor share an edge with one. */
    private fun freeCells(layout: List<ShipPlacement>): Int {
        val taken = CellSet()
        layout.forEach { taken.add(Candidate.of(it).claim) }
        return CELL_COUNT - taken.size
    }
}
