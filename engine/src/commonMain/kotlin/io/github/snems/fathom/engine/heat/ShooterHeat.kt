package io.github.snems.fathom.engine.heat

import kotlinx.serialization.Serializable

/**
 * Where a shooter shoots, shot number by shot number, counted over [games] fleets of a layout source.
 */
@Serializable
internal data class ShooterHeat(
    val shooter: String,
    val layout: String,
    val games: Int,
    /**
     * For each shot number, the games in which that shot went to each cell.
     */
    val turns: List<List<Int>>,
)
