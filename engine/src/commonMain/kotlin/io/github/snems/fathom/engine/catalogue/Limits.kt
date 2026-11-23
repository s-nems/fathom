package io.github.snems.fathom.engine.catalogue

import io.github.snems.fathom.engine.heat.LayoutHeatCounter
import io.github.snems.fathom.engine.heat.ShooterHeatCounter
import io.github.snems.fathom.engine.measure.RunPart
import kotlinx.serialization.Serializable

/**
 * The most a caller may ask for at once, so that a page need not repeat these numbers.
 */
@Serializable
internal data class Limits(
    /**
     * Games in one part of an arena cell.
     */
    val partGames: Int,
    /**
     * Games in a whole run, over all its parts.
     */
    val runGames: Long,
    /**
     * Games in one count of where a shooter shoots.
     */
    val shooterHeatGames: Int,
    /**
     * Layouts in one count of where a source places its ships.
     */
    val heatLayouts: Int,
) {
    companion object {
        fun ofTheEngine() =
            Limits(
                partGames = RunPart.GAMES.last,
                runGames = RunPart.RUN_GAMES,
                shooterHeatGames = ShooterHeatCounter.GAMES.last,
                heatLayouts = LayoutHeatCounter.LAYOUTS.last,
            )
    }
}
