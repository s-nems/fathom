package io.github.snems.fathom.arena.layouts

import jd.mg.ships.tournament.api.ShipPlacement
import kotlin.random.Random

/**
 * The fleets of a file, picked at random.
 */
class FileLayouts(
    private val layouts: List<List<ShipPlacement>>,
) : LayoutSource {
    override fun layout(random: Random): List<ShipPlacement> = layouts.random(random)
}
