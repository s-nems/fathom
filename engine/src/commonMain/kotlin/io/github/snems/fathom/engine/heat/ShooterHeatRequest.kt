package io.github.snems.fathom.engine.heat

import kotlinx.serialization.Serializable

/**
 * Asks where a shooter shoots, shot number by shot number, over [games] games of a run from [firstGame] on.
 * The counts of the parts of a run add up to the counts of the run.
 */
@Serializable
internal data class ShooterHeatRequest(
    val shooter: String,
    val layout: String,
    val games: Int,
    val seed: Long,
    val firstGame: Int = 0,
)
