package io.github.snems.fathom.engine.measure

import kotlinx.serialization.Serializable

/**
 * Asks for a part of one cell of an arena table: [games] games of the run from [firstGame] on, in which the
 * shooter sinks fleets of the layout source. A game depends on the seed and its number only, so a cell can be
 * measured in parts, in any order and on any number of workers.
 */
@Serializable
internal data class CellChunkRequest(
    val shooter: String,
    val layout: String,
    val seed: Long,
    val firstGame: Int,
    val games: Int,
)
