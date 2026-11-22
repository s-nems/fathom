package io.github.snems.fathom.arena.layouts

import io.github.snems.fathom.arena.inParallel
import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/**
 * Seeds of separate random streams lie this far apart, more than any number of games in one run.
 */
internal const val SEED_STRIDE = 1_000_003L

/**
 * A way of placing a whole fleet.
 */
fun interface LayoutSource {
    fun layout(random: Random): List<ShipPlacement>
}

/**
 * Many layouts of the source, each from its own random stream so that they can be drawn in parallel.
 */
fun LayoutSource.draw(
    count: Int,
    seed: Long,
): List<List<ShipPlacement>> = inParallel(count) { index -> layout(Random(seed * SEED_STRIDE + index)) }
