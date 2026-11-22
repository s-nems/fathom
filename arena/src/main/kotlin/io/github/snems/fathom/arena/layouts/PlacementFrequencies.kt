package io.github.snems.fathom.arena.layouts

import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/**
 * How often a layout source uses each placement, counted over many of its layouts.
 */
class PlacementFrequencies(
    source: LayoutSource,
    layouts: Int,
    seed: Long,
) {
    private val counts: Map<ShipPlacement, Int> =
        Random(seed).let { random -> List(layouts) { source.layout(random) }.flatten().groupingBy { it }.eachCount() }

    /**
     * Times the placement was seen, plus one so that an unseen placement still counts.
     */
    fun weightOf(ship: ShipPlacement): Long = (counts[ship] ?: 0) + 1L
}
