package io.github.snems.fathom.engine.heat

import io.github.snems.fathom.arena.layouts.draw
import io.github.snems.fathom.board.FLEET_SHIP_SIZES
import io.github.snems.fathom.board.cells
import io.github.snems.fathom.engine.board.CELLS
import io.github.snems.fathom.engine.board.Ship
import io.github.snems.fathom.engine.board.cell
import io.github.snems.fathom.engine.catalogue.layoutSource
import jd.mg.ships.tournament.api.ShipPlacement

/**
 * Counts, cell by cell, where a layout source places its ships.
 */
internal object LayoutHeatCounter {
    val LAYOUTS = 1..5_000

    /**
     * Number of layouts handed out whole, to show real fleets next to the counts.
     */
    private const val SAMPLES = 12

    /**
     * @throws IllegalArgumentException if there is no such source or the count is out of range
     */
    fun count(
        source: String,
        count: Int,
        seed: Long,
    ): LayoutHeat {
        require(count in LAYOUTS) { "The number of layouts has to be in $LAYOUTS" }
        val layouts = layoutSource(source).draw(count, seed)
        return LayoutHeat(
            source = source,
            count = count,
            cells = covered(layouts) { true },
            bySize = FLEET_SHIP_SIZES.distinct().associateWith { size -> covered(layouts) { it.size == size } },
            samples = layouts.take(SAMPLES).map { ships -> ships.map(Ship::of) },
        )
    }

    /**
     * For each cell, the layouts in which one of the chosen ships covers it.
     */
    private fun covered(
        layouts: List<List<ShipPlacement>>,
        chosen: (ShipPlacement) -> Boolean,
    ): List<Int> {
        val counts = IntArray(CELLS)
        for (ships in layouts) {
            ships.filter(chosen).forEach { ship -> ship.cells().forEach { counts[it.cell()]++ } }
        }
        return counts.asList()
    }
}
